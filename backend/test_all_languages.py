"""
Test all Judge0 languages with stdin input.
Run: python test_all_languages.py
"""
import requests
import json
import time

JUDGE0_API_URL = "http://localhost:2358"

# Test cases: (language_id, language_name, source_code, stdin, expected_output_contains)
TEST_CASES = [
    (71, "Python 3.8.1", 'name = input()\nprint(f"Hello, {name}!")', "World", "Hello, World!"),
    (63, "JavaScript Node.js", 'process.stdin.resume();\nprocess.stdin.setEncoding("utf8");\nlet data = "";\nprocess.stdin.on("data", d => data += d);\nprocess.stdin.on("end", () => { console.log("Hello, " + data.trim() + "!"); });', "World", "Hello, World!"),
    (74, "TypeScript 3.7.4", 'declare var process: any;\nprocess.stdin.resume();\nprocess.stdin.setEncoding("utf8");\nlet data = "";\nprocess.stdin.on("data", (d: string) => data += d);\nprocess.stdin.on("end", () => { console.log("Hello, " + data.trim() + "!"); });', "World", "Hello, World!"),
    (62, "Java OpenJDK 13", 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String name = sc.nextLine();\n        System.out.println("Hello, " + name + "!");\n    }\n}', "World", "Hello, World!"),
    (54, "C++ GCC 9.2.0", '#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    string name;\n    getline(cin, name);\n    cout << "Hello, " << name << "!" << endl;\n    return 0;\n}', "World", "Hello, World!"),
    (50, "C GCC 9.2.0", '#include <stdio.h>\n#include <string.h>\nint main() {\n    char name[100];\n    fgets(name, 100, stdin);\n    name[strcspn(name, "\\n")] = 0;\n    printf("Hello, %s!\\n", name);\n    return 0;\n}', "World", "Hello, World!"),
    (51, "C# Mono 6.6.0", 'using System;\nclass Program {\n    static void Main(string[] args) {\n        string name = Console.ReadLine();\n        Console.WriteLine($"Hello, {name}!");\n    }\n}', "World", "Hello, World!"),
    (72, "Ruby 2.7.0", 'name = gets.chomp\nputs "Hello, #{name}!"', "World", "Hello, World!"),
    (60, "Go 1.13.5", 'package main\nimport (\n    "bufio"\n    "fmt"\n    "os"\n    "strings"\n)\nfunc main() {\n    reader := bufio.NewReader(os.Stdin)\n    name, _ := reader.ReadString(\'\\n\')\n    name = strings.TrimSpace(name)\n    fmt.Printf("Hello, %s!\\n", name)\n}', "World", "Hello, World!"),
    (68, "PHP 7.4.1", '<?php\n$name = trim(fgets(STDIN));\necho "Hello, $name!\\n";\n?>', "World", "Hello, World!"),
    (83, "Swift 5.2.3", 'import Foundation\nif let name = readLine() {\n    print("Hello, \\(name)!")\n}', "World", "Hello, World!"),
    (78, "Kotlin 1.3.70", 'fun main() {\n    val name = readLine()!!\n    println("Hello, $name!")\n}', "World", "Hello, World!"),
    (73, "Rust 1.40.0", 'use std::io;\nfn main() {\n    let mut name = String::new();\n    io::stdin().read_line(&mut name).unwrap();\n    let name = name.trim();\n    println!("Hello, {}!", name);\n}', "World", "Hello, World!"),
]

def test_language(lang_id, lang_name, source_code, stdin, expected):
    payload = {
        "language_id": lang_id,
        "source_code": source_code,
        "stdin": stdin
    }
    try:
        resp = requests.post(
            f"{JUDGE0_API_URL}/submissions/?base64_encoded=false&wait=true",
            json=payload,
            timeout=60,
            headers={"Content-Type": "application/json"}
        )
        if resp.status_code not in (200, 201):
            return False, f"HTTP {resp.status_code}: {resp.text[:200]}"
        
        result = resp.json()
        status = result.get("status", {})
        status_id = status.get("id", 0)
        status_desc = status.get("description", "Unknown")
        stdout = (result.get("stdout") or "").strip()
        stderr = (result.get("stderr") or "").strip()
        compile_output = (result.get("compile_output") or "").strip()
        message = (result.get("message") or "").strip()
        exec_time = result.get("time", "?")
        memory = result.get("memory", "?")

        if status_id == 3:  # Accepted
            if expected in stdout:
                return True, f"stdout='{stdout}' | time={exec_time}s mem={memory}KB"
            else:
                return False, f"Output mismatch: got '{stdout}', expected '{expected}'"
        elif status_id == 6:  # Compilation Error
            return False, f"Compile Error: {compile_output[:300]}"
        elif status_id == 13:  # Internal Error (sandbox)
            return False, f"Sandbox Error: {message[:300]}"
        elif status_id == 5:  # TLE
            return False, f"Time Limit Exceeded"
        else:
            error_info = stderr or compile_output or message or status_desc
            return False, f"Status {status_id} ({status_desc}): {error_info[:300]}"
    except Exception as e:
        return False, f"Exception: {str(e)[:200]}"

if __name__ == "__main__":
    print("=" * 70)
    print("  Judge0 Language Test Suite - All 13 Languages with stdin")
    print("=" * 70)
    
    passed = 0
    failed = 0
    results = []

    for lang_id, lang_name, code, stdin, expected in TEST_CASES:
        print(f"\nTesting {lang_name} (id={lang_id})...", end=" ", flush=True)
        success, detail = test_language(lang_id, lang_name, code, stdin, expected)
        if success:
            print(f"PASS")
            print(f"  {detail}")
            passed += 1
            results.append((lang_name, "PASS", detail))
        else:
            print(f"FAIL")
            print(f"  {detail}")
            failed += 1
            results.append((lang_name, "FAIL", detail))

    print("\n" + "=" * 70)
    print(f"  Results: {passed} passed, {failed} failed, {passed + failed} total")
    print("=" * 70)
    
    if failed > 0:
        print("\nFailed languages:")
        for name, status, detail in results:
            if status == "FAIL":
                print(f"  - {name}: {detail}")
