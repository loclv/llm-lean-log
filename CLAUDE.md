# Project Rules

## Error Handling

Always handle errors, do not let them bubble up.
When use `try` to propagate an error, always log it before returning it.

## Work Logging (Required)

Whenever you finish a task or modify code, you must log your work using the `l-log` CLI:
`l-log add ./logs/chat.csv "<Task Name>" --tags="<tags>" --problem="<problem>" --solution="<solution>" --action="<action>" --files="<files>" --tech-stack="<tech>" --cause="<cause>" --tradeoff="<tradeoff>" --spec-decisions="<spec-decisions>" --should-know="<should-know>" --created-by-agent="<agent-name>"`

Ensure log path: `./logs/chat.csv`
