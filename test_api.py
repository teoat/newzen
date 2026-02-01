
import subprocess
import time
import requests
import os

def run_test():
    env = os.environ.copy()
    env["PYTHONPATH"] = "."
    env["SECRET_KEY"] = "CHANGE_THIS_TO_A_SECURE_RANDOM_STRING"
    env["ENCRYPTION_SECRET"] = "32_BYTE_STRING_FOR_ENCRYPTION_!"
    
    # Start server
    proc = subprocess.Popen(
        ["python3", "-m", "uvicorn", "app.main:app", "--port", "8200"],
        cwd="zenith-lite/backend",
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )
    
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMTllMjk2MS0xMTQwLTRjYzQtODBhYy1kZmM0MzhjYTg3OTkiLCJleHAiOjE3Njk4NDM5MDYsInR5cGUiOiJhY2Nlc3MifQ.0enyAsTIqAs_2pGj-trCj9f8x2EdznWG0U7OqtGVFPo"
    url = "http://localhost:8200/api/v1/project"
    
    print("Waiting for server to boot...")
    max_retries = 30
    for i in range(max_retries):
        try:
            res = requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=2)
            print(f"Status Code: {res.status_code}")
            print(f"Response: {res.text[:500]}")
            break
        except requests.exceptions.ConnectionError:
            time.sleep(1)
            continue
    else:
        print("Server timed out.")
    
    proc.terminate()
    # Print some logs
    print("\n--- Server Logs (First 100 lines) ---")
    for _ in range(100):
        line = proc.stdout.readline()
        if line:
            print(line.strip())

if __name__ == "__main__":
    run_test()
