## ServiceCallExplorer

### Intro

ServiceCallExplorer is a frida snippet that empowers you to instrument all service-call(IPC call through well-known system-services) by their names

### Workflow

1. import `vinstrument` | `instrument` from `libs/services.ts`
2. config your watch point by apply service names as arguments to `vinstrument` or config a `DesignatedSignatureServiceType` (which accept a regex filter array for method name and a `noisy` option to mute/unmute stacktrace printing) param to `instrument`
   a built-in `SignificantServiceTypes` type is provided to assist typescript auto-completion
   additional, predefined configurations for common usage are also supplied as `Predefined.JustWander`, `Predefined.PrivacyMonitor`,`MaliciousAppMonitor`, feel free to utilize or override them
3. `npm run watch` | `npm run build`
4. have run

### Sample Output

![Sample Instrumentation](./art/sample.png)
