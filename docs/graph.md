# Graph

## Basic workflow

```mermaid
graph TD;
    CSV-file-->LLMs;
    CSV-file-->CLI;
    CLI-->LLMs;
    CSV-file-->CLI/WebApp
    CLI/WebApp-->human
```
