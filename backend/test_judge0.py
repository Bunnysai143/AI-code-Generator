"""Test all Judge0 languages to see which ones work."""
import requests

JUDGE0_URL = "http://localhost:2358"

langs = {
    'python':    (71, 'print(42)'),
    'javascript':(63, 'console.log(42)'),
    'java':      (62, 'public class Main { public static void main(String[] args) { System.out.println(42); } }'),
    'cpp':       (54, '#include<iostream>\nusing namespace std;\nint main(){cout<<42;return 0;}'),
    'c':         (50, '#include<stdio.h>\nint main(){printf("42");return 0;}'),
    'csharp':    (51, 'using System; class Program { static void Main() { Console.WriteLine(42); } }'),
    'ruby':      (72, 'puts 42'),
    'go':        (60, 'package main\nimport "fmt"\nfunc main(){fmt.Println(42)}'),
    'php':       (68, '<?php echo 42; ?>'),
    'swift':     (83, 'print(42)'),
    'kotlin':    (78, 'fun main(){println(42)}'),
    'rust':      (73, 'fn main(){println!("42");}'),
    'typescript':(74, 'console.log(42)'),
}

for name, (lid, code) in langs.items():
    try:
        r = requests.post(
            f"{JUDGE0_URL}/submissions/?base64_encoded=false&wait=true",
            json={"language_id": lid, "source_code": code, "stdin": ""},
            timeout=30,
        )
        if r.status_code in (200, 201):
            d = r.json()
            status_desc = d.get("status", {}).get("description", "?")
            stdout = (d.get("stdout") or "").strip()
            stderr = (d.get("stderr") or "").strip()[:60]
            message = (d.get("message") or "").strip()[:80]
            print(f"  OK   {name:12} id={lid:3}  status={status_desc:20}  stdout={stdout!r}")
            if stderr:
                print(f"       {'':12}            stderr={stderr!r}")
            if message:
                print(f"       {'':12}            message={message!r}")
        else:
            print(f"  FAIL {name:12} id={lid:3}  HTTP {r.status_code}")
    except Exception as e:
        print(f"  ERR  {name:12} id={lid:3}  {e}")
