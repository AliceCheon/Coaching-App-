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
