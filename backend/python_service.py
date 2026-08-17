#!/usr/bin/env python3
"""
Python CLI & IPC Service Runner for BILLER.
Called by Express server for executing Python-driven analytics, database audits, and financial pipelines.
"""
import sys
import json
import os
from db import MongoDBHandler

def main():
    try:
        # Read input from stdin if provided
        input_data = {}
        if not sys.stdin.isatty():
            raw_input = sys.stdin.read()
            if raw_input.strip():
                input_data = json.loads(raw_input)

        command = input_data.get("command", "health")
        payload = input_data.get("payload", {})
        
        handler = MongoDBHandler(
            uri=input_data.get("mongodb_uri") or os.getenv("MONGODB_URI", ""),
            db_name=input_data.get("db_name") or os.getenv("MONGODB_DB_NAME", "biller_db")
        )

        if command == "health":
            result = {
                "status": "ok",
                "engine": "Python 3.10",
                "service": "Biller-Python-Backend",
                "mongoStatus": handler.get_status()
            }
        elif command == "analytics":
            bills = payload.get("bills", [])
            payments = payload.get("payments", [])
            result = handler.compute_financial_analytics(bills, payments)
            result["status"] = "ok"
            result["calculatedBy"] = "Python 3 Analytics Engine"
        elif command == "validate_bill":
            bill = payload.get("bill", {})
            # Validate dimensional calculations
            errors = []
            for idx, item in enumerate(bill.get("items", [])):
                if item.get("productType") == "area":
                    w = float(item.get("width", 0) or 0)
                    h = float(item.get("height", 0) or 0)
                    if w <= 0 or h <= 0:
                        errors.append(f"Item #{idx+1} ({item.get('productName')}) has invalid dimensions: {w}x{h}")
            
            result = {
                "status": "ok" if len(errors) == 0 else "error",
                "errors": errors,
                "validated": len(errors) == 0
            }
        else:
            result = {
                "status": "unknown_command",
                "command": command
            }

        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
