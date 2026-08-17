
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';

import {
  Customer,
  Product,
  Bill,
  PaymentRecord,
  ShopSettings,
  UserProfile,
  NavigationTab,
  PaymentMethod,
} from '../types';

import {
  initialUser,
  initialShopSettings,
  initialCustomers,
  initialProducts,
  initialBills,
  initialPayments,
} from '../data/mockData';

/* =========================================================
   DATABASE STATUS
========================================================= */

export interface DatabaseStatus {
  status:
    | 'connected'
    | 'connecting'
    | 'fallback_mode'
    | 'disconnected';

  dbName: string;
  hasUri: boolean;
  isAtlas?: boolean;
  lastPingMs: number;
  lastError: string | null;

  stats?: {
    collections?: string[];
    billsCount?: number;
    productsCount?: number;
    customersCount?: number;
    paymentsCount?: number;
  };
}

/* =========================================================
   PYTHON ENGINE STATUS
========================================================= */

export interface PythonEngineStatus {
  status: string;
  engine?: string;
  service?: string;
  lastAudit?: any;
}

/* =========================================================
   STORE CONTEXT TYPE
========================================================= */

interface StoreContextType {
  /* Navigation */
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;

  selectedInvoiceId: string | null;
  viewInvoice: (invoiceId: string) => void;

  /* Authentication */
  user: UserProfile | null;
  isAuthenticated: boolean;

  login: (
    emailOrUsername: string,
    password?: string,
    remember?: boolean
  ) => Promise<boolean>;

  logout: () => void;

  /* Data */
  customers: Customer[];
  products: Product[];
  bills: Bill[];
  payments: PaymentRecord[];
  settings: ShopSettings;

  /* Database */
  dbStatus: DatabaseStatus;
  isSyncing: boolean;
  lastSyncTime: Date | null;

  pythonEngine: PythonEngineStatus;

  connectMongoUri: (
    uri: string,
    dbName?: string
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;

  syncNow: () => Promise<void>;

  runPythonAudit: () => Promise<any>;

  /* Search */
  globalSearch: string;
  setGlobalSearch: (search: string) => void;

  /* Bills */
  addBill: (
    billData: Omit<Bill, 'id' | 'createdAt'>
  ) => Bill;

  deleteBill: (id: string) => void;

  updateBillStatus: (
    id: string,
    additionalPaid: number,
    method: PaymentMethod
  ) => void;

  /* Products */
  addProduct: (
    product: Omit<Product, 'id'>
  ) => Product;

  updateProduct: (
    id: string,
    updates: Partial<Product>
  ) => void;

  deleteProduct: (id: string) => void;

  /* Customers */
  addCustomer: (
    customer: Omit<
      Customer,
      'id' | 'totalPurchases' | 'totalPaid' | 'pendingBalance'
    >
  ) => Customer;

  updateCustomer: (
    id: string,
    updates: Partial<Customer>
  ) => void;

  deleteCustomer: (id: string) => void;

  /* Payments */
  recordPayment: (
    payment: Omit<PaymentRecord, 'id' | 'timestamp'>
  ) => Promise<PaymentRecord>;

  /* Settings */
  updateSettings: (
    newSettings: Partial<ShopSettings>
  ) => void;

  resetToDefaults: () => void;

  /* Currency */
  formatCurrency: (amount: number) => string;
  currencySymbol: string;

  /* Metrics */
  metrics: {
    totalRevenue: number;
    cashCollected: number;
    pendingAmount: number;
    netProfit: number;

    todayPaymentsTotal: number;
    todayCash: number;
    todayUpi: number;
    todayCard: number;

    todayCashCount: number;
    todayUpiCount: number;
    todayCardCount: number;
  };
}

/* =========================================================
   CONTEXT
========================================================= */

const StoreContext = createContext<
  StoreContextType | undefined
>(undefined);

/* =========================================================
   LOCAL STORAGE KEYS
========================================================= */

const STORAGE_KEYS = {
  USER: 'biller_user_v1',
  AUTH: 'biller_is_auth_v1',

  ACCESS_TOKEN: 'biller_access_token',

  CUSTOMERS: 'biller_customers_v1',
  PRODUCTS: 'biller_products_v1',
  BILLS: 'biller_bills_v1',
  PAYMENTS: 'biller_payments_v1',

  SETTINGS: 'biller_settings_v1',
};

/* =========================================================
   SAFE JSON PARSER
========================================================= */

const getLocalStorage = <T,>(
  key: string,
  fallback: T
): T => {
  try {
    const saved = localStorage.getItem(key);

    if (!saved) {
      return fallback;
    }

    return JSON.parse(saved) as T;
  } catch (error) {
    console.warn(
      `[BILLER] Failed to read localStorage key: ${key}`,
      error
    );

    return fallback;
  }
};

/* =========================================================
   AUTH INITIAL STATE
========================================================= */

const getInitialAuthenticatedState = (): boolean => {
  try {
    return (
      localStorage.getItem(
        STORAGE_KEYS.AUTH
      ) === 'true'
    );
  } catch {
    return false;
  }
};

const getInitialUser = (): UserProfile | null => {
  const authenticated =
    getInitialAuthenticatedState();

  if (!authenticated) {
    return null;
  }

  return getLocalStorage<UserProfile | null>(
    STORAGE_KEYS.USER,
    initialUser
  );
};

/* =========================================================
   PROVIDER
========================================================= */

export const StoreProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  /* =======================================================
     NAVIGATION
  ======================================================= */

  const [currentTab, setCurrentTab] =
    useState<NavigationTab>('dashboard');

  const [selectedInvoiceId, setSelectedInvoiceId] =
    useState<string | null>('bill-1');

  const [globalSearch, setGlobalSearch] =
    useState<string>('');

  /* =======================================================
     DATABASE STATE
  ======================================================= */

  const [dbStatus, setDbStatus] =
    useState<DatabaseStatus>({
      status: 'fallback_mode',
      dbName: 'biller_db',
      hasUri: false,
      lastPingMs: 0,
      lastError: null,
    });

  const [isSyncing, setIsSyncing] =
    useState<boolean>(false);

  const [lastSyncTime, setLastSyncTime] =
    useState<Date | null>(null);

  /* =======================================================
     PYTHON ENGINE
  ======================================================= */

  const [pythonEngine, setPythonEngine] =
    useState<PythonEngineStatus>({
      status: 'Ready',
      engine: 'Python 3.10 Engine',
      service: 'Biller Analytical Backend',
    });

  /* =======================================================
     AUTH STATE
  ======================================================= */

  const [user, setUser] =
    useState<UserProfile | null>(
      getInitialUser
    );

  const [isAuthenticated, setIsAuthenticated] =
    useState<boolean>(
      getInitialAuthenticatedState
    );

  /* =======================================================
     CUSTOMER STATE
  ======================================================= */

  const [customers, setCustomers] =
    useState<Customer[]>(() =>
      getLocalStorage<Customer[]>(
        STORAGE_KEYS.CUSTOMERS,
        initialCustomers
      )
    );

  /* =======================================================
     PRODUCT STATE
  ======================================================= */

  const [products, setProducts] =
    useState<Product[]>(() =>
      getLocalStorage<Product[]>(
        STORAGE_KEYS.PRODUCTS,
        initialProducts
      )
    );

  /* =======================================================
     BILL STATE
  ======================================================= */

  const [bills, setBills] =
    useState<Bill[]>(() =>
      getLocalStorage<Bill[]>(
        STORAGE_KEYS.BILLS,
        initialBills
      )
    );

  /* =======================================================
     PAYMENT STATE
  ======================================================= */

  const [payments, setPayments] =
    useState<PaymentRecord[]>(() =>
      getLocalStorage<PaymentRecord[]>(
        STORAGE_KEYS.PAYMENTS,
        initialPayments
      )
    );

  /* =======================================================
     SHOP SETTINGS
  ======================================================= */

  const [settings, setSettings] =
    useState<ShopSettings>(() =>
      getLocalStorage<ShopSettings>(
        STORAGE_KEYS.SETTINGS,
        initialShopSettings
      )
    );

  /* =======================================================
     LOCAL STORAGE PERSISTENCE
  ======================================================= */

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(
          STORAGE_KEYS.USER,
          JSON.stringify(user)
        );
      } else {
        localStorage.removeItem(
          STORAGE_KEYS.USER
        );
      }
    } catch (error) {
      console.error(
        '[BILLER] Failed to save user',
        error
      );
    }
  }, [user]);

  /*
    IMPORTANT:
    Authentication persistence is intentionally NOT handled
    here.

    Login/logout control it explicitly so that the
    "remember me" option works correctly.
  */

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.CUSTOMERS,
        JSON.stringify(customers)
      );
    } catch (error) {
      console.error(
        '[BILLER] Failed to save customers',
        error
      );
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.PRODUCTS,
        JSON.stringify(products)
      );
    } catch (error) {
      console.error(
        '[BILLER] Failed to save products',
        error
      );
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.BILLS,
        JSON.stringify(bills)
      );
    } catch (error) {
      console.error(
        '[BILLER] Failed to save bills',
        error
      );
    }
  }, [bills]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.PAYMENTS,
        JSON.stringify(payments)
      );
    } catch (error) {
      console.error(
        '[BILLER] Failed to save payments',
        error
      );
    }
  }, [payments]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error(
        '[BILLER] Failed to save settings',
        error
      );
    }
  }, [settings]);

  /* =======================================================
     AUTHENTICATED API HELPER
  ======================================================= */

  const getAccessToken = useCallback(() => {
    try {
      return (
        localStorage.getItem(
          STORAGE_KEYS.ACCESS_TOKEN
        ) ||
        sessionStorage.getItem(
          STORAGE_KEYS.ACCESS_TOKEN
        )
      );
    } catch {
      return null;
    }
  }, []);

  const apiFetch = useCallback(
    async (
      input: RequestInfo | URL,
      init: RequestInit = {}
    ): Promise<Response> => {
      const token =
        getAccessToken();

      const headers = new Headers(
        init.headers
      );

      if (!headers.has('Content-Type')) {
        headers.set(
          'Content-Type',
          'application/json'
        );
      }

      if (token) {
        headers.set(
          'Authorization',
          `Bearer ${token}`
        );
      }

      return fetch(input, {
        ...init,
        headers,
      });
    },
    [getAccessToken]
  );

  /* =======================================================
     PUSH DATA TO MONGODB
  ======================================================= */

  const pushToServer = useCallback(
    async (
      dataToSync?: {
        bills?: Bill[];
        products?: Product[];
        customers?: Customer[];
        payments?: PaymentRecord[];
        settings?: ShopSettings;
      }
    ) => {
      try {
        setIsSyncing(true);

        const payload = {
          bills:
            dataToSync?.bills ?? bills,

          products:
            dataToSync?.products ?? products,

          customers:
            dataToSync?.customers ?? customers,

          payments:
            dataToSync?.payments ?? payments,

          settings:
            dataToSync?.settings ?? settings,
        };

        const response =
          await apiFetch(
            '/api/db/sync',
            {
              method: 'POST',
              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        if (!response.ok) {
          throw new Error(
            `Database sync failed: ${response.status}`
          );
        }

        setLastSyncTime(
          new Date()
        );

        setDbStatus(prev => ({
          ...prev,

          status: 'connected',

          lastError: null,
        }));
      } catch (error: any) {
        console.warn(
          '[BILLER] Database sync failed:',
          error
        );

        setDbStatus(prev => ({
          ...prev,

          status:
            'fallback_mode',

          lastError:
            error?.message ||
            'Database sync failed',
        }));
      } finally {
        setIsSyncing(false);
      }
    },
    [
      bills,
      products,
      customers,
      payments,
      settings,
      apiFetch,
    ]
  );

  /* =======================================================
     CHECK DATABASE STATUS
  ======================================================= */

  const refreshDbStatus =
    useCallback(
      async () => {
        try {
          const response =
            await apiFetch(
              '/api/db/status',
              {
                method: 'GET',
              }
            );

          if (!response.ok) {
            throw new Error(
              `Status request failed: ${response.status}`
            );
          }

          const data =
            await response.json();

          setDbStatus(data);
        } catch (error: any) {
          console.warn(
            '[BILLER] Database status check failed:',
            error
          );

          setDbStatus(prev => ({
            ...prev,

            status:
              'disconnected',

            lastError:
              error?.message ||
              'Unable to connect to backend',
          }));
        }
      },
      [apiFetch]
    );

  /* =======================================================
     LOAD DATABASE DATA
  ======================================================= */

  const loadDatabaseData =
    useCallback(
      async () => {
        try {
          setIsSyncing(true);

          const response =
            await apiFetch(
              '/api/db/data',
              {
                method: 'GET',
              }
            );

          if (!response.ok) {
            throw new Error(
              `Database data request failed: ${response.status}`
            );
          }

          const data =
            await response.json();

          console.log(
            '[BILLER] Database data loaded:',
            data
          );

          if (
            Array.isArray(
              data.customers
            )
          ) {
            setCustomers(
              data.customers
            );
          }

          if (
            Array.isArray(
              data.products
            )
          ) {
            setProducts(
              data.products
            );
          }

          if (
            Array.isArray(
              data.bills
            )
          ) {
            setBills(
              data.bills
            );
          }

          if (
            Array.isArray(
              data.payments
            )
          ) {
            setPayments(
              data.payments
            );
          }

          if (
            data.settings &&
            typeof data.settings ===
              'object'
          ) {
            setSettings(
              data.settings
            );
          }

          if (
            data.source ===
            'mongodb'
          ) {
            setDbStatus(prev => ({
              ...prev,

              status:
                'connected',

              lastError: null,
            }));
          }

          setLastSyncTime(
            new Date()
          );
        } catch (error: any) {
          console.error(
            '[BILLER] Failed to load database data:',
            error
          );

          setDbStatus(prev => ({
            ...prev,

            status:
              'fallback_mode',

            lastError:
              error?.message ||
              'Failed to load database data',
          }));
        } finally {
          setIsSyncing(false);
        }
      },
      [apiFetch]
    );

  /* =======================================================
     SYNC NOW
  ======================================================= */

  const syncNow =
    useCallback(
      async () => {
        try {
          setIsSyncing(true);

          await pushToServer();

          await refreshDbStatus();
        } finally {
          setIsSyncing(false);
        }
      },
      [
        pushToServer,
        refreshDbStatus,
      ]
    );

  /* =======================================================
     CONNECT CUSTOM MONGODB URI
  ======================================================= */

  const connectMongoUri = useCallback(
    async (
      uri: string,
      dbName = 'biller_db'
    ): Promise<{
      success: boolean;
      error?: string;
    }> => {
      if (!uri.trim()) {
        return {
          success: false,

          error:
            'MongoDB URI is required.',
        };
      }

      try {
        setIsSyncing(true);

        const response =
          await apiFetch(
            '/api/db/config',
            {
              method: 'POST',

              body:
                JSON.stringify({
                  uri,
                  dbName,
                }),
            }
          );

        let data: any = null;

        try {
          data =
            await response.json();
        } catch {
          data = null;
        }

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              data?.error ||
              `MongoDB configuration failed: ${response.status}`
          );
        }

        await refreshDbStatus();

        if (data?.success) {
          await pushToServer();

          return {
            success: true,
          };
        }

        return {
          success: false,

          error:
            data?.error ||
            'Failed to connect MongoDB.',
        };
      } catch (error: any) {
        console.error(
          '[BILLER] MongoDB connection failed:',
          error
        );

        return {
          success: false,

          error:
            error?.message ||
            'MongoDB connection failed.',
        };
      } finally {
        setIsSyncing(false);
      }
    },
    [
      apiFetch,
      refreshDbStatus,
      pushToServer,
    ]
  );

  /* =======================================================
     PYTHON ANALYTICS AUDIT
  ======================================================= */

  const runPythonAudit =
    useCallback(
      async (): Promise<any> => {
        try {
          const response =
            await apiFetch(
              '/api/python/analytics',
              {
                method: 'POST',

                body:
                  JSON.stringify({
                    bills,
                    payments,
                  }),
              }
            );

          if (!response.ok) {
            throw new Error(
              `Python analytics failed: ${response.status}`
            );
          }

          const result =
            await response.json();

          setPythonEngine(
            prev => ({
              ...prev,

              status:
                'Verified',

              lastAudit:
                result,
            })
          );

          return result;
        } catch (error: any) {
          console.error(
            '[BILLER] Python calculation failed:',
            error
          );

          setPythonEngine(
            prev => ({
              ...prev,

              status: 'Error',
            })
          );

          return null;
        }
      },
      [
        apiFetch,
        bills,
        payments,
      ]
    );

  /* =======================================================
     INITIAL DATABASE + SSE CONNECTION
  ======================================================= */

  useEffect(() => {
    refreshDbStatus();

    loadDatabaseData();

    let eventSource:
      | EventSource
      | null = null;

    try {
      eventSource =
        new EventSource(
          '/api/realtime/stream'
        );

      eventSource.addEventListener(
        'db_status',
        (
          event: MessageEvent
        ) => {
          try {
            const parsed =
              JSON.parse(
                event.data
              );

            setDbStatus(prev => ({
              ...prev,

              status:
                parsed.status ||
                prev.status,

              lastPingMs:
                parsed.ping ??
                prev.lastPingMs,
            }));
          } catch {
            console.warn(
              '[BILLER] Invalid db_status event'
            );
          }
        }
      );

      eventSource.addEventListener(
        'sync_completed',
        () => {
          setLastSyncTime(
            new Date()
          );
        }
      );

      eventSource.onerror = () => {
        console.warn(
          '[BILLER] SSE connection lost.'
        );
      };
    } catch (error) {
      console.warn(
        '[BILLER] SSE connection failed:',
        error
      );
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [
    refreshDbStatus,
    loadDatabaseData,
  ]);

  /* =======================================================
     LOGIN
  ======================================================= */

  const login = useCallback(
    async (
      emailOrUsername: string,
      password = '',
      remember = true
    ): Promise<boolean> => {
      const identifier =
        emailOrUsername.trim();

      if (
        !identifier ||
        !password
      ) {
        return false;
      }

      try {
        const response =
          await fetch(
            '/api/auth/login',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  emailOrUsername:
                    identifier,

                  password,
                }),
            }
          );

        let data: any = null;

        try {
          data =
            await response.json();
        } catch {
          data = null;
        }

        if (
          !response.ok ||
          !data?.access_token
        ) {
          console.error(
            '[BILLER] Login failed:',
            data?.detail ||
              'Invalid credentials'
          );

          return false;
        }

        const loggedInUser =
          data?.user;

        const newUser:
          UserProfile = {
          id:
            loggedInUser?.id ||
            'usr-1',

          name:
            loggedInUser?.name ||
            (
              identifier.includes(
                '@'
              )
                ? identifier.split(
                    '@'
                  )[0]
                : identifier
            ),

          email:
            loggedInUser?.email ||
            (
              identifier.includes(
                '@'
              )
                ? identifier
                : `${identifier}@biller.com`
            ),

          username:
            loggedInUser?.username ||
            identifier,

          role:
            loggedInUser?.role ||
            'Store Manager',

          avatarUrl:
            loggedInUser?.avatarUrl ||
            initialUser.avatarUrl,
        };

        /* -----------------------------------------------
           UPDATE REACT STATE
        ------------------------------------------------ */

        setUser(newUser);

        setIsAuthenticated(true);

        /* -----------------------------------------------
           SAVE TOKEN
        ------------------------------------------------ */

        if (remember) {
          localStorage.setItem(
            STORAGE_KEYS.ACCESS_TOKEN,
            data.access_token
          );

          localStorage.setItem(
            STORAGE_KEYS.AUTH,
            'true'
          );

          sessionStorage.removeItem(
            STORAGE_KEYS.ACCESS_TOKEN
          );
        } else {
          sessionStorage.setItem(
            STORAGE_KEYS.ACCESS_TOKEN,
            data.access_token
          );

          localStorage.removeItem(
            STORAGE_KEYS.ACCESS_TOKEN
          );

          localStorage.removeItem(
            STORAGE_KEYS.AUTH
          );
        }

        console.log(
          '[BILLER] Login successful:',
          newUser.username
        );

        return true;
      } catch (error) {
        console.error(
          '[BILLER] Login request failed:',
          error
        );

        return false;
      }
    },
    []
  );

  /* =======================================================
     LOGOUT
  ======================================================= */

  const logout =
    useCallback(() => {
      setIsAuthenticated(
        false
      );

      setUser(null);

      localStorage.removeItem(
        STORAGE_KEYS.AUTH
      );

      localStorage.removeItem(
        STORAGE_KEYS.USER
      );

      localStorage.removeItem(
        STORAGE_KEYS.ACCESS_TOKEN
      );

      sessionStorage.removeItem(
        STORAGE_KEYS.ACCESS_TOKEN
      );

      console.log(
        '[BILLER] User logged out'
      );
    }, []);

  /* =======================================================
     VIEW INVOICE
  ======================================================= */

  const viewInvoice = (
    invoiceId: string
  ) => {
    setSelectedInvoiceId(
      invoiceId
    );

    setCurrentTab(
      'invoice_preview'
    );
  };

  /* =======================================================
     ADD BILL
  ======================================================= */

  const addBill = (
    billData: Omit<
      Bill,
      'id' | 'createdAt'
    >
  ): Bill => {
    if (!billData.customerId) {
      throw new Error(
        'Customer is required.'
      );
    }

    if (
      !billData.items ||
      billData.items.length === 0
    ) {
      throw new Error(
        'At least one bill item is required.'
      );
    }

    if (
      !billData.invoiceNumber?.trim()
    ) {
      throw new Error(
        'Invoice number is required.'
      );
    }

    for (const item of billData.items) {
      if (
        !item.productName?.trim()
      ) {
        throw new Error(
          'Product name is required.'
        );
      }

      const quantity =
        Number(item.quantity) || 0;

      const rate =
        Number(item.rate) || 0;

      const amount =
        Number(item.amount) || 0;

      if (quantity <= 0) {
        throw new Error(
          `Invalid quantity for ${item.productName}.`
        );
      }

      if (rate < 0) {
        throw new Error(
          `Invalid rate for ${item.productName}.`
        );
      }

      if (amount < 0) {
        throw new Error(
          `Invalid amount for ${item.productName}.`
        );
      }

      if (
        item.type === 'area' ||
        item.productType === 'area'
      ) {
        const width =
          Number(item.width) || 0;

        const height =
          Number(item.height) || 0;

        if (
          width <= 0 ||
          height <= 0
        ) {
          throw new Error(
            `Valid width and height are required for ${item.productName}.`
          );
        }
      }
    }

    const totalAmount =
      Number(
        billData.totalAmount
      ) || 0;

    const advancePaid =
      Number(
        billData.advancePaid
      ) || 0;

    const balanceDue =
      Number(
        billData.balanceDue
      ) || 0;

    if (totalAmount <= 0) {
      throw new Error(
        'Bill total must be greater than ₹0.'
      );
    }

    if (advancePaid < 0) {
      throw new Error(
        'Advance payment cannot be negative.'
      );
    }

    if (
      advancePaid > totalAmount
    ) {
      throw new Error(
        'Advance payment cannot exceed the bill total.'
      );
    }

    if (balanceDue < 0) {
      throw new Error(
        'Balance amount cannot be negative.'
      );
    }

    const newId =
      `bill-${Date.now()}`;

    const newBill: Bill = {
      ...billData,

      id: newId,

      createdAt:
        new Date().toISOString(),
    };

    const updatedBills = [
      newBill,
      ...bills,
    ];

    setBills(updatedBills);

    /* -----------------------------------------------------
       UPDATE CUSTOMER
    ----------------------------------------------------- */

    const updatedCustomers =
      customers.map(
        customer => {
          if (
            customer.id !==
            billData.customerId
          ) {
            return customer;
          }

          return {
            ...customer,

            totalPurchases:
              (
                customer.totalPurchases ||
                0
              ) +
              totalAmount,

            totalPaid:
              (
                customer.totalPaid ||
                0
              ) +
              advancePaid,

            pendingBalance:
              (
                customer.pendingBalance ||
                0
              ) +
              balanceDue,

            lastPurchaseDate:
              billData.date,
          };
        }
      );

    setCustomers(
      updatedCustomers
    );

    /* -----------------------------------------------------
       CREATE PAYMENT RECORD FOR ADVANCE
    ----------------------------------------------------- */

    let updatedPayments =
      payments;

    if (advancePaid > 0) {
      const now =
        new Date();

      const newPayment:
        PaymentRecord = {
        id:
          `pay-${Date.now()}`,

        date:
          now.toLocaleDateString(
            'en-IN',
            {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }
          ),

        time:
          now.toLocaleTimeString(
            'en-IN',
            {
              hour: '2-digit',
              minute: '2-digit',
            }
          ),

        timestamp:
          Date.now(),

        invoiceId:
          newId,

        invoiceNumber:
          billData.invoiceNumber,

        customerId:
          billData.customerId,

        customerName:
          billData.customerName,

        customerType:
          'Standard Account',

        method:
          billData.paymentMethod,

        amount:
          advancePaid,

        collectedBy:
          user?.name ||
          'Store Staff',

        refTxnId:
          `TXN-${Math.floor(
            10000000 +
              Math.random() *
                90000000
          )}`,

        status:
          'Success',
      };

      updatedPayments = [
        newPayment,
        ...payments,
      ];

      setPayments(
        updatedPayments
      );
    }

    void pushToServer({
      bills:
        updatedBills,

      customers:
        updatedCustomers,

      payments:
        updatedPayments,
    });

    return newBill;
  };

  /* =======================================================
     DELETE BILL
  ======================================================= */

  const deleteBill = (
    id: string
  ) => {
    const targetBill =
      bills.find(
        bill => bill.id === id
      );

    let updatedCustomers =
      customers;

    if (targetBill) {
      updatedCustomers =
        customers.map(
          customer => {
            if (
              customer.id !==
              targetBill.customerId
            ) {
              return customer;
            }

            return {
              ...customer,

              totalPurchases:
                Math.max(
                  0,
                  (
                    customer.totalPurchases ||
                    0
                  ) -
                    targetBill.totalAmount
                ),

              totalPaid:
                Math.max(
                  0,
                  (
                    customer.totalPaid ||
                    0
                  ) -
                    targetBill.advancePaid
                ),

              pendingBalance:
                Math.max(
                  0,
                  (
                    customer.pendingBalance ||
                    0
                  ) -
                    targetBill.balanceDue
                ),
            };
          }
        );

      setCustomers(
        updatedCustomers
      );
    }

    const updatedBills =
      bills.filter(
        bill =>
          bill.id !== id
      );

    setBills(
      updatedBills
    );

    const updatedPayments =
      payments.filter(
        payment =>
          payment.invoiceId !== id
      );

    setPayments(
      updatedPayments
    );

    void pushToServer({
      bills:
        updatedBills,

      customers:
        updatedCustomers,

      payments:
        updatedPayments,
    });
  };

  /* =======================================================
     UPDATE BILL / ADD PAYMENT
  ======================================================= */

  const updateBillStatus = (
    id: string,
    additionalPaid: number,
    method: PaymentMethod
  ) => {
    const amount =
      Number(additionalPaid) || 0;

    if (amount <= 0) {
      throw new Error(
        'Payment amount must be greater than ₹0.'
      );
    }

    const targetBill =
      bills.find(
        bill => bill.id === id
      );

    if (!targetBill) {
      throw new Error(
        'Bill not found.'
      );
    }

    const currentAdvance =
      Number(
        targetBill.advancePaid
      ) || 0;

    const totalAmount =
      Number(
        targetBill.totalAmount
      ) || 0;

    const currentBalance =
      Number(
        targetBill.balanceDue
      ) || 0;

    if (
      amount > currentBalance
    ) {
      throw new Error(
        'Payment cannot exceed the pending balance.'
      );
    }

    const newAdvance =
      currentAdvance +
      amount;

    const newBalance =
      Math.max(
        0,
        totalAmount -
          newAdvance
      );

    const newStatus =
      newBalance <= 0.01
        ? 'PAID'
        : newAdvance > 0
        ? 'PARTIAL'
        : 'UNPAID';

    const updatedBills =
      bills.map(
        bill => {
          if (
            bill.id !== id
          ) {
            return bill;
          }

          return {
            ...bill,

            advancePaid:
              newAdvance,

            balanceDue:
              newBalance,

            status:
              newStatus,
          };
        }
      );

    setBills(
      updatedBills
    );

    const updatedCustomers =
      customers.map(
        customer => {
          if (
            customer.id !==
            targetBill.customerId
          ) {
            return customer;
          }

          return {
            ...customer,

            totalPaid:
              (
                customer.totalPaid ||
                0
              ) +
              amount,

            pendingBalance:
              Math.max(
                0,
                (
                  customer.pendingBalance ||
                  0
                ) -
                  amount
              ),
          };
        }
      );

    setCustomers(
      updatedCustomers
    );

    const now =
      new Date();

    const newPayment:
      PaymentRecord = {
      id:
        `pay-${Date.now()}`,

      date:
        now.toLocaleDateString(
          'en-IN',
          {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }
        ),

      time:
        now.toLocaleTimeString(
          'en-IN',
          {
            hour: '2-digit',
            minute: '2-digit',
          }
        ),

      timestamp:
        Date.now(),

      invoiceId:
        targetBill.id,

      invoiceNumber:
        targetBill.invoiceNumber,

      customerId:
        targetBill.customerId,

      customerName:
        targetBill.customerName,

      customerType:
        'Settlement',

      method,

      amount,

      collectedBy:
        user?.name ||
        'Staff',

      refTxnId:
        `TXN-${Math.floor(
          10000000 +
            Math.random() *
              90000000
        )}`,

      status:
        'Success',
    };

    const updatedPayments = [
      newPayment,
      ...payments,
    ];

    setPayments(
      updatedPayments
    );

    void pushToServer({
      bills:
        updatedBills,

      customers:
        updatedCustomers,

      payments:
        updatedPayments,
    });
  };

  /* =======================================================
     ADD PRODUCT
  ======================================================= */

  const addProduct = (
    prodData: Omit<Product, 'id'>
  ): Product => {
    const newProduct:
      Product = {
      ...prodData,

      id:
        `prod-${Date.now()}`,
    };

    const updated = [
      newProduct,
      ...products,
    ];

    setProducts(updated);

    void pushToServer({
      products:
        updated,
    });

    return newProduct;
  };

  /* =======================================================
     UPDATE PRODUCT
  ======================================================= */

  const updateProduct = (
    id: string,
    updates: Partial<Product>
  ) => {
    const updated =
      products.map(
        product =>
          product.id === id
            ? {
                ...product,
                ...updates,
              }
            : product
      );

    setProducts(updated);

    void pushToServer({
      products:
        updated,
    });
  };

  /* =======================================================
     DELETE PRODUCT
  ======================================================= */

  const deleteProduct = (
    id: string
  ) => {
    const updated =
      products.filter(
        product =>
          product.id !== id
      );

    setProducts(updated);

    void pushToServer({
      products:
        updated,
    });
  };

  /* =======================================================
     ADD CUSTOMER
  ======================================================= */

  const addCustomer = (
    customerData: Omit<
      Customer,
      | 'id'
      | 'totalPurchases'
      | 'totalPaid'
      | 'pendingBalance'
    >
  ): Customer => {
    const newCustomer:
      Customer = {
      ...customerData,

      id:
        `cust-${Date.now()}`,

      totalPurchases: 0,

      totalPaid: 0,

      pendingBalance: 0,

      lastPurchaseDate:
        'New Customer',
    };

    const updated = [
      newCustomer,
      ...customers,
    ];

    setCustomers(updated);

    void pushToServer({
      customers:
        updated,
    });

    return newCustomer;
  };

  /* =======================================================
     UPDATE CUSTOMER
  ======================================================= */

  const updateCustomer = (
    id: string,
    updates: Partial<Customer>
  ) => {
    const updated =
      customers.map(
        customer =>
          customer.id === id
            ? {
                ...customer,
                ...updates,
              }
            : customer
      );

    setCustomers(updated);

    void pushToServer({
      customers:
        updated,
    });
  };

  /* =======================================================
     DELETE CUSTOMER
  ======================================================= */

  const deleteCustomer = (
    id: string
  ) => {
    const updated =
      customers.filter(
        customer =>
          customer.id !== id
      );

    setCustomers(updated);

    void pushToServer({
      customers:
        updated,
    });
  };

  /* =======================================================
     RECORD PAYMENT THROUGH FASTAPI
  ======================================================= */

  const recordPayment =
    async (
      payData: Omit<
        PaymentRecord,
        'id' | 'timestamp'
      >
    ): Promise<PaymentRecord> => {
      const paymentId =
        `pay-${Date.now()}`;

      const paymentPayload = {
        ...payData,

        id: paymentId,

        timestamp:
          Date.now(),
      };

      try {
        setIsSyncing(true);

        const response =
          await apiFetch(
            '/api/payments/',
            {
              method: 'POST',

              body:
                JSON.stringify(
                  paymentPayload
                ),
            }
          );

        let data: any =
          null;

        try {
          data =
            await response.json();
        } catch {
          data = null;
        }

        if (!response.ok) {
          const detail =
            data?.detail ||
            data?.message ||
            `Payment creation failed (${response.status})`;

          throw new Error(
            detail
          );
        }

        if (
          !data?.success ||
          !data?.payment
        ) {
          throw new Error(
            'Payment was not created by the server.'
          );
        }

        const createdPayment =
          data.payment as PaymentRecord;

        setPayments(
          prev => [
            createdPayment,

            ...prev.filter(
              payment =>
                payment.id !==
                createdPayment.id
            ),
          ]
        );

        if (data.bill) {
          setBills(
            prev =>
              prev.map(
                bill =>
                  bill.id ===
                  data.bill.id
                    ? {
                        ...bill,
                        ...data.bill,
                      }
                    : bill
              )
          );
        }

        /*
          IMPORTANT:

          The backend payment endpoint should be the
          source of truth for bill/customer balances.

          We only update the customer locally if the
          backend returns the customer information.
        */

        if (
          data.customer
        ) {
          setCustomers(
            prev =>
              prev.map(
                customer =>
                  customer.id ===
                  data.customer.id
                    ? {
                        ...customer,
                        ...data.customer,
                      }
                    : customer
              )
          );
        } else if (
          createdPayment.customerId
        ) {
          /*
            Backward-compatible local update.
          */

          setCustomers(
            prev =>
              prev.map(
                customer => {
                  if (
                    customer.id !==
                    createdPayment.customerId
                  ) {
                    return customer;
                  }

                  return {
                    ...customer,

                    totalPaid:
                      (
                        customer.totalPaid ||
                        0
                      ) +
                      createdPayment.amount,

                    pendingBalance:
                      Math.max(
                        0,
                        (
                          customer.pendingBalance ||
                          0
                        ) -
                          createdPayment.amount
                      ),
                  };
                }
              )
          );
        }

        setLastSyncTime(
          new Date()
        );

        return createdPayment;
      } catch (error: any) {
        console.error(
          '[BILLER] Payment creation failed:',
          error
        );

        throw error;
      } finally {
        setIsSyncing(false);
      }
    };

  /* =======================================================
     UPDATE SETTINGS
  ======================================================= */

  const updateSettings = (
    newSettings: Partial<ShopSettings>
  ) => {
    const updated = {
      ...settings,

      ...newSettings,
    };

    setSettings(updated);

    void pushToServer({
      settings:
        updated,
    });
  };

  /* =======================================================
     RESET TO DEFAULTS
  ======================================================= */

  const resetToDefaults = () => {
    setCustomers(
      initialCustomers
    );

    setProducts(
      initialProducts
    );

    setBills(
      initialBills
    );

    setPayments(
      initialPayments
    );

    setSettings(
      initialShopSettings
    );

    void pushToServer({
      customers:
        initialCustomers,

      products:
        initialProducts,

      bills:
        initialBills,

      payments:
        initialPayments,

      settings:
        initialShopSettings,
    });
  };

  /* =======================================================
     CURRENCY
  ======================================================= */

  const currencySymbol =
    settings.currency ||
    '₹';

  const formatCurrency = (
    amount: number
  ): string => {
    const symbol =
      settings.currency ||
      '₹';

    const numericAmount =
      Number(amount) || 0;

    return `${symbol}${numericAmount.toLocaleString(
      'en-IN',
      {
        minimumFractionDigits: 2,

        maximumFractionDigits: 2,
      }
    )}`;
  };

  /* =======================================================
     DATE HELPER
  ======================================================= */

  const isToday = (
    value:
      | string
      | number
      | Date
  ): boolean => {
    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return false;
    }

    const today =
      new Date();

    return (
      date.getDate() ===
        today.getDate() &&
      date.getMonth() ===
        today.getMonth() &&
      date.getFullYear() ===
        today.getFullYear()
    );
  };

  /* =======================================================
     COMPUTED METRICS
  ======================================================= */

  const metrics =
    useMemo(() => {
      /* ---------------------------------------------------
         TOTAL REVENUE
      --------------------------------------------------- */

      const totalRevenue =
        bills.reduce(
          (total, bill) =>
            total +
            (
              Number(
                bill.totalAmount
              ) || 0
            ),
          0
        );

      /* ---------------------------------------------------
         TOTAL COLLECTED
      --------------------------------------------------- */

      const successfulPayments =
        payments.filter(
          payment =>
            payment.status ===
            'Success'
        );

      const cashCollected =
        successfulPayments.reduce(
          (total, payment) =>
            total +
            (
              Number(
                payment.amount
              ) || 0
            ),
          0
        );

      /* ---------------------------------------------------
         PENDING
      --------------------------------------------------- */

      const pendingAmount =
        bills.reduce(
          (total, bill) =>
            total +
            (
              Number(
                bill.balanceDue
              ) || 0
            ),
          0
        );

      /* ---------------------------------------------------
         ESTIMATED COST
      --------------------------------------------------- */

      const totalCost =
        bills.reduce(
          (
            billTotal,
            bill
          ) => {
            const items =
              bill.items || [];

            if (
              items.length === 0
            ) {
              return (
                billTotal +
                (
                  Number(
                    bill.totalAmount
                  ) || 0
                ) *
                  0.6
              );
            }

            const itemsCost =
              items.reduce(
                (
                  itemTotal,
                  item
                ) => {
                  const rate =
                    Number(
                      item.costRate ??
                        Number(
                          item.rate
                        ) *
                          0.6
                    ) || 0;

                  const quantity =
                    Number(
                      item.quantity
                    ) || 1;

                  if (
                    item.productType ===
                    'area'
                  ) {
                    const sqft =
                      Number(
                        item.sqft
                      ) ||
                      (
                        Number(
                          item.width
                        ) || 1
                      ) *
                        (
                          Number(
                            item.height
                          ) || 1
                        );

                    return (
                      itemTotal +
                      sqft *
                        quantity *
                        rate
                    );
                  }

                  return (
                    itemTotal +
                    quantity *
                      rate
                  );
                },
                0
              );

            return (
              billTotal +
              itemsCost
            );
          },
          0
        );

      /* ---------------------------------------------------
         NET PROFIT
      --------------------------------------------------- */

      const netProfit =
        Math.max(
          0,
          totalRevenue -
            totalCost
        );

      /* ---------------------------------------------------
         TODAY'S PAYMENTS
      --------------------------------------------------- */

      const todaySuccessfulPayments =
        successfulPayments.filter(
          payment => {
            if (
              payment.timestamp
            ) {
              return isToday(
                payment.timestamp
              );
            }

            return false;
          }
        );

      /* ---------------------------------------------------
         CASH
      --------------------------------------------------- */

      const todayCashPayments =
        todaySuccessfulPayments.filter(
          payment =>
            payment.method ===
            'Cash'
        );

      const todayCash =
        todayCashPayments.reduce(
          (total, payment) =>
            total +
            (
              Number(
                payment.amount
              ) || 0
            ),
          0
        );

      /* ---------------------------------------------------
         UPI
      --------------------------------------------------- */

      const todayUpiPayments =
        todaySuccessfulPayments.filter(
          payment =>
            payment.method ===
            'UPI'
        );

      const todayUpi =
        todayUpiPayments.reduce(
          (total, payment) =>
            total +
            (
              Number(
                payment.amount
              ) || 0
            ),
          0
        );

      /* ---------------------------------------------------
         CARD
      --------------------------------------------------- */

      const todayCardPayments =
        todaySuccessfulPayments.filter(
          payment =>
            payment.method ===
            'Card'
        );

      const todayCard =
        todayCardPayments.reduce(
          (total, payment) =>
            total +
            (
              Number(
                payment.amount
              ) || 0
            ),
          0
        );

      /* ---------------------------------------------------
         TODAY TOTAL
      --------------------------------------------------- */

      const todayPaymentsTotal =
        todayCash +
        todayUpi +
        todayCard;

      return {
        totalRevenue,

        cashCollected,

        pendingAmount,

        netProfit,

        todayPaymentsTotal,

        todayCash,

        todayUpi,

        todayCard,

        todayCashCount:
          todayCashPayments.length,

        todayUpiCount:
          todayUpiPayments.length,

        todayCardCount:
          todayCardPayments.length,
      };
    }, [bills, payments]);

  /* =======================================================
     PROVIDER VALUE
  ======================================================= */

  const contextValue =
    useMemo<StoreContextType>(
      () => ({
        /* Navigation */

        currentTab,

        setCurrentTab,

        selectedInvoiceId,

        viewInvoice,

        /* Authentication */

        user,

        isAuthenticated,

        login,

        logout,

        /* Data */

        customers,

        products,

        bills,

        payments,

        settings,

        /* Database */

        dbStatus,

        isSyncing,

        lastSyncTime,

        pythonEngine,

        connectMongoUri,

        syncNow,

        runPythonAudit,

        /* Search */

        globalSearch,

        setGlobalSearch,

        /* Bills */

        addBill,

        deleteBill,

        updateBillStatus,

        /* Products */

        addProduct,

        updateProduct,

        deleteProduct,

        /* Customers */

        addCustomer,

        updateCustomer,

        deleteCustomer,

        /* Payments */

        recordPayment,

        /* Settings */

        updateSettings,

        resetToDefaults,

        /* Currency */

        formatCurrency,

        currencySymbol,

        /* Metrics */

        metrics,
      }),
      [
        currentTab,
        selectedInvoiceId,
        globalSearch,

        user,
        isAuthenticated,

        customers,
        products,
        bills,
        payments,
        settings,

        dbStatus,
        isSyncing,
        lastSyncTime,
        pythonEngine,

        currencySymbol,
        metrics,

        login,
        logout,

        connectMongoUri,
        syncNow,
        runPythonAudit,

        pushToServer,

        viewInvoice,
        addBill,
        deleteBill,
        updateBillStatus,

        addProduct,
        updateProduct,
        deleteProduct,

        addCustomer,
        updateCustomer,
        deleteCustomer,

        recordPayment,

        updateSettings,
        resetToDefaults,

        formatCurrency,
      ]
    );

  /* =======================================================
     PROVIDER
  ======================================================= */

  return (
    <StoreContext.Provider
      value={contextValue}
    >
      {children}
    </StoreContext.Provider>
  );
};

/* =========================================================
   USE STORE HOOK
========================================================= */

export const useStore =
  (): StoreContextType => {
    const context =
      useContext(
        StoreContext
      );

    if (!context) {
      throw new Error(
        'useStore must be used within a StoreProvider'
      );
    }

    return context;
  };
