#!/usr/bin/env python3
"""
Test Runner for ChefAsap Backend
Convenient script to run all tests from the main backend directory.
"""

import os
import sys
import subprocess

def run_test(test_name, description):
    """Run a specific test file"""
    print(f"\n{'='*50}")
    print(f"🧪 {description}")
    print(f"{'='*50}")
    
    test_path = os.path.join("tests", test_name)
    try:
        result = subprocess.run([sys.executable, test_path], 
                              capture_output=False, 
                              check=True)
        print(f"✅ {description} - PASSED")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - FAILED")
        return False

def main():
    """Run all tests"""
    print("🚀 ChefAsap Backend Test Suite")
    print("Running all tests...")
    
    tests = [
        ("test_connection.py", "Database Connection Test"),
        ("test_flask.py", "Flask Application Test"),
    ]
    
    results = []
    for test_file, description in tests:
        success = run_test(test_file, description)
        results.append((description, success))
    
    # Summary
    print(f"\n{'='*50}")
    print("📊 TEST SUMMARY")
    print(f"{'='*50}")
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for description, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{description}: {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed!")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)