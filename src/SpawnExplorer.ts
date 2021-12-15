/*
1. Instrumentation.execStartActivity()
2. ActivityTaskManager.getService().startActivity()
3. ActivityTaskManagerService.startActivity()
4. startActivityAsUser()
5. getActivityStartController().setCaller()
6. ActivityStart.executeRequest()

====

ProcessList.handleProcessStartedLocked()
Processlist.startProcessLocked()
    ActivityManagerService.getContentProviderImpl()
    ActivityService.bringUpServiceLocked()
    ActivityManagerService.bindBackupAgent()
    BroadcastQueue.processNextBroadcastLocked()
    startProcess
        ActivityTaskManagerService.startProcessAsync()
            ActivityStack.resumeTopActivityLocked() // 系统重启, 非主动启动
        ActivityStackSupervisor.startSpecificActivity() //
*/

type AheadComponent = 'service' | 'activity' | 'provider'
type BehindComponent = 'broadcast'
type Component = AheadComponent | BehindComponent
type Log =
  | {
      type: Component
      message: string // ???
      by: string // callerPackage
      target: string // component
    }
  | {
      type: 'proc'
      message: string
      target: string
      reason: string
      seq: number
    }

export function penetrate(
  tracer: (_: string) => void,
  fatal: (_: string) => void
) {
  const { contains, append } = (() => {
    const log: Log[] = []
    return {
      contains: (seq: number) => log.map((it) => (it as any).seq).includes(seq),
      append: (data: Log) => {
        log.unshift(data)
        const [last, secondLast] = log
        if (
          last.type == 'proc' &&
          ['activity', 'service', 'provider'].includes(secondLast?.type)
        ) {
          fatal(`${secondLast.message}\n${last.message}\n\n`)
        } else if (last.type == 'broadcast' && secondLast?.type == 'proc') {
          fatal(`${last.message}\n${secondLast.message}\n\n`)
        }
      },
    }
  })()

  const Sig = {
    ProcessList: 'com.android.server.am.ProcessList',
    ProcessRecord: 'com.android.server.am.ProcessRecord',
    HostingRecord: 'com.android.server.am.HostingRecord',
    int: 'int',
    boolean: 'boolean',
    String: 'java.lang.String',
    IApplicationThread: 'android.app.IApplicationThread',
    Intent: 'android.content.Intent',
    ActiveService: 'com.android.server.am.ActiveServices',
    BroadcastQueue: 'com.android.server.am.BroadcastQueue',
    ActivityStack: 'com.android.server.wm.ActivityStack',
    ActivityManagerService: 'com.android.server.am.ActivityManagerService',
    ActivityStackSupervisor: 'com.android.server.wm.ActivityStackSupervisor',
    ActivityStarter: 'com.android.server.wm.ActivityStarter',
  }

  const ProcessList = Java.use(Sig.ProcessList)
  const ProcessRecord = Java.use(Sig.ProcessRecord)
  const HostingRecord = Java.use(Sig.HostingRecord)
  const ActivityStackSupervisor = Java.use(Sig.ActivityStackSupervisor)

  // [Process]
  ProcessList.startProcessLocked.overload(
    Sig.ProcessRecord,
    Sig.HostingRecord,
    Sig.int,
    Sig.boolean,
    Sig.boolean,
    Sig.boolean,
    Sig.String
  ).implementation = function (
    process: any,
    hosting: any,
    zygotePolicyFlag: number,
    disableHiddenApiCheck: boolean,
    disableTestApiCheck: boolean,
    mountExtStorageFull: boolean,
    abiOverride: string
  ) {
    const args = [
      process,
      hosting,
      zygotePolicyFlag,
      disableHiddenApiCheck,
      disableTestApiCheck,
      mountExtStorageFull,
      abiOverride,
    ]
    const returns = this.startProcessLocked(...args)
    const startSeq = process.startSeq.value
    const procMessage = `[Must] Start proc: for ${hosting.mHostingName.value}, because: ${hosting.mHostingType.value}, pid: ${process.pid.value} startSeq:${process.startSeq.value}`
    tracer(procMessage)
    if (!contains(startSeq)) {
      append({
        type: 'proc',
        seq: startSeq,
        target: hosting.mHostingName.value,
        reason: hosting.mHostingType.value,
        message: procMessage,
      })
    } else {
      console.warn(`drop duplicate startSeq: ${startSeq}`)
    }
    return returns
  }

  // hook four kinds of callers
  const ActivityManagerService = Java.use(Sig.ActivityManagerService)
  const ActiveServices = Java.use(Sig.ActiveService)
  const BroadcastQueue = Java.use(Sig.BroadcastQueue)
  const ActivityStack = Java.use(Sig.ActivityStack)
  const ActivityStarter = Java.use(Sig.ActivityStarter)

  // [Provider]
  ActivityManagerService.getContentProviderImpl.implementation = function (
    ...args: any[]
  ) {
    const [, name, , , callingPackage, callingTag, stable] = args
    const providerMessage = `[May] Start provider: ${name} by ${callingPackage}`
    tracer(providerMessage)
    append({
      by: callingPackage,
      type: 'provider',
      message: providerMessage,
      target: name,
    })
    return this.getContentProviderImpl(...args)
  }

  // [Service]
  /**
   * 1. restart service : performServiceRestartLocked / ServiceRestarter [?]
   * 2. bind service:
   * 3. start service:
   *    3.1 rescheduleDelayedStartsLocked [?]
   *    3.2 startServiceLocked  []
   *
   * @param args
   * @returns
   */
  // ActiveServices.bringUpServiceLocked.implementation = function (
  //   ...args: any[]
  // ) {
  //   const [
  //     serviceRecord,
  //     intentFlag,
  //     executeInForeground,
  //     whileRestarting,
  //     permissionReviewRequired,
  //   ] = args
  //   console.log(
  //     `[May] ${
  //       whileRestarting ? 'Restart' : 'Start'
  //     } service: ${serviceRecord} by ???`
  //   )
  //   return this.bringUpServiceLocked(...args)
  // }

  // [StartService]
  ActiveServices.startServiceLocked.overload(
    Sig.IApplicationThread,
    Sig.Intent,
    Sig.String,
    Sig.int,
    Sig.int,
    Sig.boolean,
    Sig.String,
    Sig.String,
    Sig.int,
    Sig.boolean
  ).implementation = function (...args: any[]) {
    const [
      caller,
      intent,
      resolvedType,
      callingPid,
      callingUid,
      fgRequired,
      callingPackage,
      callingFeatureId,
      userId,
      allowBackgroundActivityStart,
    ] = args
    const message = `[May] Start service ${intent} by ${callingPackage}`
    tracer(message)
    append({
      by: callingPackage,
      type: 'service',
      message: message,
      target: intent,
    })
    return this.startServiceLocked(...args)
  }

  // [BindService]
  ActiveServices.bindServiceLocked.implementation = function (...args: any[]) {
    const [
      caller,
      token,
      intent,
      resolvedType,
      connection,
      flags,
      instanceName,
      callingPackage,
      userId,
    ] = args
    const bindServiceMessage = `[May] Bind service ${intent} by ${callingPackage}`
    tracer(bindServiceMessage)
    append({
      by: callingPackage,
      type: 'service',
      message: bindServiceMessage,
      target: intent,
    })
    return this.bindServiceLocked(...args)
  }

  // [Activity]
  ActivityStarter.executeRequest.implementation = function (request: any) {
    const startActivityMessage = `[May] Start activity(executeRequest):${request.intent.value} by:${request.callingPackage.value} resultTo:${request.resultWho}`
    tracer(startActivityMessage)
    append({
      by: request.callingPackage.value,
      type: 'activity',
      message: startActivityMessage,
      target: request.intent.value,
    })
    return this.executeRequest(request)
  }

  // [Broadcast]
  BroadcastQueue.maybeAddAllowBackgroundActivityStartsToken.implementation =
    function (process: any, broadcast: any) {
      const broadcastMessage = `[May & After] Start broadcast:${broadcast.intent.value}  by: ${broadcast.callerPackage.value}`
      tracer(broadcastMessage)
      append({
        by: broadcast.callerPackage.value,
        type: 'broadcast',
        message: broadcastMessage,
        target: broadcast.intent.value,
      })
      return this.maybeAddAllowBackgroundActivityStartsToken(process, broadcast)
    }
}
