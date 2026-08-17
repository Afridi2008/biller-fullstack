"""
MongoDB database integration module for BILLER.

PyMongo + MongoDB Atlas with:
- automatic reconnect support
- local fallback persistence
- centralized customer financial aggregation
- safe database synchronization
"""

import os
import json
import time
from typing import Dict, Any, Optional

from dotenv import load_dotenv
from pymongo import MongoClient


# =========================================================
# ENVIRONMENT
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_FILE = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_FILE)

MONGODB_URI = os.getenv("MONGODB_URI", "")
DB_NAME = os.getenv("MONGODB_DB_NAME", "biller_db")

PROJECT_ROOT = os.path.dirname(BASE_DIR)

FALLBACK_FILE = os.path.join(
    PROJECT_ROOT,
    ".db_fallback_data.json"
)


# =========================================================
# DATABASE MANAGER
# =========================================================

class MongoDatabaseManager:

    def __init__(
        self,
        uri: str = None,
        db_name: str = None
    ):
        self.uri = uri if uri is not None else MONGODB_URI
        self.db_name = db_name if db_name is not None else DB_NAME

        self.client: Optional[MongoClient] = None
        self.db = None

        self.is_connected = False
        self.last_ping_ms = 0
        self.last_error: Optional[str] = None

        self._init_connection()


    # =====================================================
    # INITIAL CONNECTION
    # =====================================================

    def _init_connection(self):

        if not self.uri:
            self.is_connected = False
            self.db = None
            self.last_error = "MONGODB_URI is not configured"

            print(
                "[FastAPI-MongoDB] MONGODB_URI is not configured. "
                "Fallback mode enabled."
            )

            return

        try:

            self.client = MongoClient(
                self.uri,
                serverSelectionTimeoutMS=10000,
                connectTimeoutMS=10000,
                socketTimeoutMS=10000,
                retryWrites=True,
                retryReads=True
            )

            start_time = time.time()

            self.client.admin.command("ping")

            self.last_ping_ms = int(
                (time.time() - start_time) * 1000
            )

            self.db = self.client[self.db_name]

            self.is_connected = True
            self.last_error = None

            print(
                f"[FastAPI-MongoDB] Connected to "
                f"{self.db_name} in "
                f"{self.last_ping_ms}ms"
            )

        except Exception as e:

            self.is_connected = False
            self.db = None
            self.last_error = str(e)

            print(
                f"[FastAPI-MongoDB] Connection failed: {e}"
            )


    # =====================================================
    # ENSURE CONNECTION
    # =====================================================

    def ensure_connection(self) -> bool:

        if not self.uri:
            self.is_connected = False
            self.db = None
            return False


        # -------------------------------------------------
        # Test existing connection
        # -------------------------------------------------

        if self.client is not None:

            try:

                start_time = time.time()

                self.client.admin.command("ping")

                self.last_ping_ms = int(
                    (time.time() - start_time) * 1000
                )

                self.db = self.client[self.db_name]

                self.is_connected = True
                self.last_error = None

                return True

            except Exception as e:

                self.is_connected = False
                self.db = None
                self.last_error = str(e)

                try:
                    self.client.close()
                except Exception:
                    pass

                self.client = None


        # -------------------------------------------------
        # Reconnect
        # -------------------------------------------------

        try:

            self.client = MongoClient(
                self.uri,
                serverSelectionTimeoutMS=10000,
                connectTimeoutMS=10000,
                socketTimeoutMS=10000,
                retryWrites=True,
                retryReads=True
            )

            start_time = time.time()

            self.client.admin.command("ping")

            self.last_ping_ms = int(
                (time.time() - start_time) * 1000
            )

            self.db = self.client[self.db_name]

            self.is_connected = True
            self.last_error = None

            print(
                f"[FastAPI-MongoDB] Reconnected to "
                f"{self.db_name} in "
                f"{self.last_ping_ms}ms"
            )

            return True

        except Exception as e:

            self.is_connected = False
            self.db = None
            self.last_error = str(e)

            print(
                f"[FastAPI-MongoDB] Reconnect failed: {e}"
            )

            return False


    # =====================================================
    # CONNECT / CHANGE DATABASE
    # =====================================================

    def connect(
        self,
        uri: str,
        db_name: str = "biller_db"
    ) -> Dict[str, Any]:

        self.uri = uri
        self.db_name = db_name or "biller_db"

        if not uri:

            if self.client:

                try:
                    self.client.close()
                except Exception:
                    pass

            self.client = None
            self.db = None
            self.is_connected = False
            self.last_error = None

            return {
                "success": True,
                "status": "fallback_mode",
                "message": "Using fallback offline storage"
            }


        connected = self.ensure_connection()

        if connected:

            return {
                "success": True,
                "status": "connected",
                "db_name": self.db_name,
                "ping_ms": self.last_ping_ms
            }


        return {
            "success": False,
            "status": "fallback_mode",
            "error": self.last_error,
            "message": (
                "Could not connect to MongoDB. "
                "Using fallback offline storage."
            )
        }


    # =====================================================
    # STATUS
    # =====================================================

    def get_status(self) -> Dict[str, Any]:

        stats = {}

        if self.is_connected:
            self.ensure_connection()


        if self.is_connected and self.db is not None:

            try:

                stats = {
                    "collections":
                        self.db.list_collection_names(),

                    "bills_count":
                        self.db["bills"].count_documents({}),

                    "products_count":
                        self.db["products"].count_documents({}),

                    "customers_count":
                        self.db["customers"].count_documents({}),

                    "payments_count":
                        self.db["payments"].count_documents({})
                }

            except Exception as e:

                self.is_connected = False
                self.last_error = str(e)

                stats = {
                    "error": str(e)
                }


        return {

            "status":
                "connected"
                if self.is_connected
                else "fallback_mode",

            "db_name":
                self.db_name,

            "has_uri":
                bool(self.uri),

            "is_atlas":
                bool(
                    self.uri
                    and (
                        "mongodb+srv://" in self.uri
                        or "mongodb.net" in self.uri
                    )
                ),

            "last_ping_ms":
                self.last_ping_ms,

            "last_error":
                self.last_error,

            "driver":
                "pymongo 4.17.0",

            "stats":
                stats,

            "timestamp":
                time.time()
        }


    # =====================================================
    # FALLBACK READ
    # =====================================================

    def read_fallback_data(self) -> Dict[str, Any]:

        try:

            if os.path.exists(FALLBACK_FILE):

                with open(
                    FALLBACK_FILE,
                    "r",
                    encoding="utf-8"
                ) as f:

                    return json.load(f)

        except Exception as e:

            print(
                f"[Fallback] Read error: {e}"
            )

        return {}


    # =====================================================
    # FALLBACK WRITE
    # =====================================================

    def write_fallback_data(
        self,
        data: Dict[str, Any]
    ):

        try:

            with open(
                FALLBACK_FILE,
                "w",
                encoding="utf-8"
            ) as f:

                json.dump(
                    data,
                    f,
                    indent=2,
                    ensure_ascii=False
                )

        except Exception as e:

            print(
                f"[Fallback] Write error: {e}"
            )


    # =====================================================
    # CUSTOMER FINANCIAL AGGREGATION
    # =====================================================

    def recalculate_customer_financials(
        self,
        customer_id: str
    ) -> Optional[Dict[str, Any]]:

        """
        Recalculate one customer's financial summary
        directly from bills.

        totalPurchases = sum of bill totalAmount
        totalPaid      = sum of bill advancePaid
        pendingBalance = sum of bill balanceDue
        """

        if not customer_id:
            return None

        if self.is_connected:
            self.ensure_connection()

        if not self.is_connected or self.db is None:
            return None

        try:

            customers_collection = self.db["customers"]
            bills_collection = self.db["bills"]

            customer = customers_collection.find_one({
                "id": customer_id
            })

            if not customer:
                return None


            bills = bills_collection.find({
                "customerId": customer_id
            })


            total_purchases = 0.0
            total_paid = 0.0
            pending_balance = 0.0


            for bill in bills:

                total_purchases += float(
                    bill.get("totalAmount", 0) or 0
                )

                total_paid += float(
                    bill.get("advancePaid", 0) or 0
                )

                pending_balance += float(
                    bill.get("balanceDue", 0) or 0
                )


            total_purchases = round(
                total_purchases,
                2
            )

            total_paid = round(
                total_paid,
                2
            )

            pending_balance = round(
                max(pending_balance, 0),
                2
            )


            customers_collection.update_one(
                {
                    "id": customer_id
                },
                {
                    "$set": {
                        "totalPurchases": total_purchases,
                        "totalPaid": total_paid,
                        "pendingBalance": pending_balance,
                        "updatedAt": time.strftime(
                            "%Y-%m-%dT%H:%M:%SZ",
                            time.gmtime()
                        )
                    }
                }
            )


            return customers_collection.find_one(
                {
                    "id": customer_id
                },
                {
                    "_id": 0
                }
            )

        except Exception as e:

            print(
                "[MongoDB] Customer financial "
                f"recalculation failed for {customer_id}: {e}"
            )

            return None


    # =====================================================
    # RECALCULATE ALL CUSTOMERS
    # =====================================================

    def recalculate_all_customer_financials(self) -> int:

        """
        Recalculate financial totals for every customer.

        Returns the number of customers recalculated.
        """

        if self.is_connected:
            self.ensure_connection()

        if not self.is_connected or self.db is None:
            return 0

        try:

            customers_collection = self.db["customers"]

            customers = list(
                customers_collection.find(
                    {},
                    {
                        "_id": 0,
                        "id": 1
                    }
                )
            )

            count = 0

            for customer in customers:

                customer_id = customer.get("id")

                if customer_id:

                    self.recalculate_customer_financials(
                        customer_id
                    )

                    count += 1

            return count

        except Exception as e:

            print(
                "[MongoDB] Failed to recalculate "
                f"all customer financials: {e}"
            )

            return 0


    # =====================================================
    # GET ALL DATA
    # =====================================================

    def get_all_data(self) -> Dict[str, Any]:

        if self.is_connected:
            self.ensure_connection()


        if self.is_connected and self.db is not None:

            try:

                def clean_doc(doc):

                    if doc and "_id" in doc:
                        doc.pop("_id", None)

                    return doc


                bills = [
                    clean_doc(d)
                    for d in self.db["bills"].find({})
                ]

                products = [
                    clean_doc(d)
                    for d in self.db["products"].find({})
                ]

                customers = [
                    clean_doc(d)
                    for d in self.db["customers"].find({})
                ]

                payments = [
                    clean_doc(d)
                    for d in self.db["payments"].find({})
                ]

                settings_list = [
                    clean_doc(d)
                    for d in self.db["settings"].find({})
                ]


                settings = (
                    settings_list[0]
                    if settings_list
                    else None
                )


                return {
                    "source": "mongodb",
                    "bills": bills,
                    "products": products,
                    "customers": customers,
                    "payments": payments,
                    "settings": settings
                }


            except Exception as e:

                print(
                    f"[MongoDB] Read failed: {e}"
                )


        # -------------------------------------------------
        # FALLBACK
        # -------------------------------------------------

        fallback = self.read_fallback_data()

        return {
            "source": "fallback",
            "bills": fallback.get("bills", []),
            "products": fallback.get("products", []),
            "customers": fallback.get("customers", []),
            "payments": fallback.get("payments", []),
            "settings": fallback.get("settings")
        }


    # =====================================================
    # BATCH SYNC
    # =====================================================

    def sync_all_data(
        self,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:

        if self.is_connected:
            self.ensure_connection()

        if not self.is_connected or self.db is None:

            self.write_fallback_data(data)

            return {
                "success": True,
                "status": "fallback_mode",
                "message": "Data saved to fallback storage",
                "synced": {
                    "bills": len(data.get("bills", [])),
                    "products": len(data.get("products", [])),
                    "customers": len(data.get("customers", [])),
                    "payments": len(data.get("payments", [])),
                    "settings": 1 if data.get("settings") else 0
                }
            }


        try:

            synced = {
                "bills": 0,
                "products": 0,
                "customers": 0,
                "payments": 0,
                "settings": 0
            }


            # -------------------------------------------------
            # BILLS
            # -------------------------------------------------

            for item in data.get("bills", []):

                if not item.get("id"):
                    continue

                self.db["bills"].replace_one(
                    {
                        "id": item["id"]
                    },
                    item,
                    upsert=True
                )

                synced["bills"] += 1


            # -------------------------------------------------
            # PRODUCTS
            # -------------------------------------------------

            for item in data.get("products", []):

                if not item.get("id"):
                    continue

                self.db["products"].replace_one(
                    {
                        "id": item["id"]
                    },
                    item,
                    upsert=True
                )

                synced["products"] += 1


            # -------------------------------------------------
            # CUSTOMERS
            # -------------------------------------------------

            for item in data.get("customers", []):

                if not item.get("id"):
                    continue

                self.db["customers"].replace_one(
                    {
                        "id": item["id"]
                    },
                    item,
                    upsert=True
                )

                synced["customers"] += 1


            # -------------------------------------------------
            # PAYMENTS
            # -------------------------------------------------

            for item in data.get("payments", []):

                if not item.get("id"):
                    continue

                self.db["payments"].replace_one(
                    {
                        "id": item["id"]
                    },
                    item,
                    upsert=True
                )

                synced["payments"] += 1


            # -------------------------------------------------
            # SETTINGS
            # -------------------------------------------------

            settings = data.get("settings")

            if settings:

                self.db["settings"].replace_one(
                    {
                        "_id": settings.get("_id")
                    }
                    if settings.get("_id")
                    else {
                        "id": settings.get(
                            "id",
                            "default"
                        )
                    },
                    settings,
                    upsert=True
                )

                synced["settings"] = 1


            # -------------------------------------------------
            # IMPORTANT:
            # Recalculate customer aggregates AFTER
            # bills have been synchronized.
            # -------------------------------------------------

            self.recalculate_all_customer_financials()


            return {
                "success": True,
                "status": "connected",
                "message": "All data synchronized successfully",
                "synced": synced
            }


        except Exception as e:

            print(
                f"[MongoDB] Sync failed: {e}"
            )

            return {
                "success": False,
                "status": "error",
                "message": f"Database synchronization failed: {e}",
                "synced": synced
            }


# =========================================================
# GLOBAL SINGLETON
# =========================================================

db_manager = MongoDatabaseManager()