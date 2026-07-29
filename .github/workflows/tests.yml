name: Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
    
    - name: Run v144 core tests
      run: node tests/v144-core.test.mjs

    - name: Run Coach rebuild tests
      run: node tests/coach-v144-rebuild.test.mjs

    - name: Run v145 release guard
      run: node tests/v145-release-guard.test.mjs

    - name: Run v145.1 Coach tools tests
      run: node tests/v1451-coach-tools.test.mjs

    - name: Run v145.2 unified sidebar tests
      run: node tests/v1452-unified-sidebar.test.mjs

    - name: Run v146.1 corrective tests
      run: node tests/v1461-corrections.test.mjs

    - name: Run v146.1 Coach UX tests
      run: node tests/v1461-coach-ux.test.mjs
