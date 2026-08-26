// ─── Server ──────────────────────────────────────────────
export const PORT = 3001;

// ─── Room Limits ─────────────────────────────────────────
export const MAX_ROOM_CAPACITY = 10;
export const ROOM_CLEANUP_DELAY_MS = 5 * 60 * 1000; // 5 minutes

// ─── Execution Limits ────────────────────────────────────
export const EXECUTION_TIMEOUT_MS = 5000; // 5 seconds
export const MAX_CODE_SIZE = 100 * 1024; // 100 KB
export const MAX_INPUT_SIZE = 10 * 1024;  // 10 KB

// ─── Supported Languages ────────────────────────────────
export const SUPPORTED_LANGUAGES = ['cpp', 'python', 'java'];

// Docker image names — built once with `docker build -t <name> ./docker/<lang>`
export const DOCKER_IMAGES = {
  cpp: 'code-executor-cpp',
  python: 'code-executor-python',
  java: 'code-executor-java',
};

// Source file names written into the workspace before execution
export const FILE_NAMES = {
  cpp: 'main.cpp',
  python: 'main.py',
  java: 'Main.java',
};

// Default boilerplate shown when a new room is created
export const DEFAULT_CODE = {
  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
  python: `print("Hello, World!")`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
};
