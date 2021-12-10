type OppoServiceNames =
  'AtlasService,DockObserver,OPPO,OPPOExService,OplusResourceManagerService,SurfaceFlinger,accessibility,account,activity,activity_task,adb,alarm,alipay,android.hardware.light.ILights/default,android.hardware.power.IPower/default,android.hardware.vibrator.IVibrator/default,android.security.identity,android.security.keystore,android.service.gatekeeper.IGateKeeperService,anti_root_dialog,app_binding,app_integrity,appops,appwidget,athenaservice,audio,auth,autofill,backup,battery,batteryproperties,batterystats,binder_calls_stats,biometric,blob_store,bluetooth_manager,bugreport,cabc,cacheinfo,carrier_config,chatty,clipboard,color_accesscontrol,color_display,color_screenshot,common_dcs,companiondevice,connectivity,connmetrics,consumer_ir,content,country_detector,cpuinfo,critical.log,crossprofileapps,dataloader_manager,dbinfo,device_config,device_identifiers,device_policy,deviceidle,devicestoragemonitor,diskstats,display,dnsresolver,dpmservice,dreams,drm.drmManager,dropbox,dynamic_filter,dynamic_system,emergency_affordance,engineer,ethernet,eventhandle,external_vibrator_service,extphone,face,felicaser,file_integrity,fingerprint,gfxinfo,gpu,graphicsstats,guardelfthermalcontrol,hardware_properties,heimdall,hephaestus_app_data_service,horae,imms,incident,incidentcompanion,incremental,input,input_method,inputflinger,installd,ions,iphonesubinfo,ipsec,isms,isub,jobscheduler,launcherapps,lights,linearmotor,location,lock_settings,looper_stats,luckymoney,manager,media.aaudio,media.audio_flinger,media.audio_policy,media.camera,media.camera.proxy,media.extractor,media.metrics,media.player,media.resource_manager,media_projection,media_resource_monitor,media_router,media_session,meminfo,midi,mount,multimediaDaemon,netd,netd_listener,netpolicy,netstats,network_management,network_score,network_stack,network_time_update_service,network_watchlist,networking_control,neuronsystem,nfc,notification,nwdiagnose,nwpower,oem_lock,oemlinklatency,oiface,onetrace,operator,oplus_nec,oplus_telephony_ext,opluscoreappservice,opluscustomize,oplusdatalimit,oplusdevicepolicy,oplusnetworkstack,oplusnetworkstats,oplusstoragemanagerservice,oppo.hans.IHansComunication,oppo_app_data_service,oppo_army,opposcreenmode,otadexopt,overlay,package,package_native,permission,permissionmgr,persistent_data_block,phone,pinner,platform_compat,platform_compat_native,power,power_monitor,print,processinfo,procstats,qti.radio.extphone,recovery,restrictions,role,rollback,runtime,scheduling_policy,search,sec_key_att_app_id_provider,secrecy,secure_element,security_permission,sensor_privacy,sensorservice,serial,servicediscovery,settings,shortcut,simphonebook,sip,slice,soundtrigger,soundtrigger_middleware,stats,statscompanion,statsmanager,statusbar,storage_healthinfo,storaged,storaged_pri,storagestats,suspend_control,system_config,system_update,telecom,telephony.registry,telephony_ims,testharness,tethering,textclassification,textservices,thermalservice,time_detector,time_zone_detector,trust,uimode,updatelock,uri_grants,usage,usagestats,usb,user,vendor.audio.vrservice,vendor.perfservice,vendor.qspmsvc,vibrator,voiceinteraction,vold,wallpaper,webviewupdate,wifi,wifinl80211,wifip2p,wifiscanner,window'

type Split<L extends string> = L extends `${infer Fst},${infer Rst}`
  ? Fst | Split<Rst>
  : L

type SignificantServiceNames =
  'account,activity,activity_task,alarm,appops,appwidget,auth,clipboard,content,input,input_method,jobscheduler,launcherapps,location,lock_settings,notification,package,permission,sensorservice,settings,shortcut,statusbar,wallpaper'

export type SignificantServiceTypes = Split<SignificantServiceNames>

export type NormalizedRule = {
  pattern: RegExp
  noisy: boolean
}

export type Rule = RegExp | NormalizedRule

export type DesignatedSignatureServiceType = {
  [T in SignificantServiceTypes]?: Rule | Rule[] | undefined
}

function resolveOverloads(
  clazz: any,
  restriction: NormalizedRule[]
): [string, boolean, any][] {
  const uniqueMethods: string[] = Array.from(
    new Set(
      (clazz.getDeclaredMethods() as any[]).map((it) => it.getName() as string)
    )
  )

  const klazz = Java.use(clazz.getName())
  return uniqueMethods
    .map(
      (methodName) =>
        [
          methodName,
          restriction.find(({ pattern }) => methodName.match(pattern))?.noisy,
        ] as const
    )
    .filter(([, trace]) => trace != undefined)
    .flatMap(([name, trace]) =>
      klazz[name].overloads.map((handle: any) => [name, trace == true, handle])
    )
}

export function vinstrument(...services: SignificantServiceTypes[]) {
  return instrument(services)
}

export function instrument(
  services: SignificantServiceTypes[] | DesignatedSignatureServiceType,
  tracer: (message: string) => void = console.log.bind(console)
) {
  const ActivityThread = Java.use('android.app.ActivityThread')
  const currentActivityThread = ActivityThread.currentActivityThread()
  const SystemServiceRegistry = Java.use('android.app.SystemServiceRegistry')
  const systemContext = currentActivityThread.getSystemUiContext()
  const JObject = Java.use('java.lang.Object')
  const Log = Java.use('android.util.Log')
  const Exception = Java.use('java.lang.Exception')
  const Process = Java.use('android.os.Process')

  const normalized =
    'length' in services
      ? services.reduce(
          (acc, ele) => ({ ...acc, [ele]: undefined }),
          {} as DesignatedSignatureServiceType
        )
      : services

  const keys = Object.keys(normalized) as SignificantServiceTypes[]

  const proxies = keys
    .map(
      (it) =>
        [it, SystemServiceRegistry.getSystemService(systemContext, it)] as [
          SignificantServiceTypes,
          any
        ]
    )
    .filter(([, value]) => Boolean(value))

  const found = proxies.map(([key]) => key)
  const dropped = keys.filter((it) => !found.includes(it))

  tracer(`trace on thread: ${Process.myPid()}`)
  tracer(`dropped services(${dropped.length}): ${dropped}`)

  proxies.forEach(([key, it]) => {
    const rule = normalized[key]
    const restriction = (!!rule ? ('length' in rule ? rule : [rule]) : [/.*/]) // set default rule
      .map((r) =>
        'noisy' in r
          ? r
          : {
              noisy: false,
              pattern: r,
            }
      ) // set default stacktrace

    let resolvedMethods = resolveOverloads(it.getClass(), restriction)

    // normalize netsed services inside `ActivityManager` & strip proxy calls
    if (key == 'activity') {
      const klazz = Java.use(it.getClass().getName())
      const ActivityManagerStubProxy = JObject.getClass.call(klazz.getService())
      const TaskManagerStubProxy = JObject.getClass.call(klazz.getTaskService())

      // application thread callbacks
      const ApplicationThreadStub = JObject.getClass.call(
        currentActivityThread.getApplicationThread()
      )
      const delegated = [
        ...resolveOverloads(ActivityManagerStubProxy, restriction),
        ...resolveOverloads(TaskManagerStubProxy, restriction),
        ...resolveOverloads(
          ApplicationThreadStub,
          restriction.map((it) => ({ ...it, noisy: false })) // callbacks form AMS does not need stack at all, cause it's fixed
        ),
      ]

      // remove getService
      resolvedMethods = resolvedMethods.filter(([it]) => it != 'getService')

      // remove duplicate calls & merge
      resolvedMethods = [
        ...resolvedMethods.filter(
          ([it]) => !delegated.some(([name]) => name == it)
        ),
        ...delegated,
      ]
    }

    resolvedMethods.forEach(([name, stack, overload]) => {
      overload.implementation = function (...args: any[]) {
        const returns = overload.apply(this, args)
        tracer(`@@@${this} #${name} (${args}): ${returns}`)
        if (stack) {
          tracer(`stack: ${Log.getStackTraceString(Exception.$new())}`)
        }
        return returns
      }
    })
  })
}

export const StackAll = {
  pattern: /.*/,
  noisy: true,
}

export const NoStackAll = {
  pattern: /.*/,
  noisy: false,
}

export const Predefined = {
  /**
   * rule for wander around an app, no specific purpose
   */
  JustWander: {
    alarm: NoStackAll,
    activity: NoStackAll,
    package: NoStackAll,
    appops: NoStackAll,
    input_method: NoStackAll,
    location: NoStackAll,
    shortcut: NoStackAll,
  },
  /**
   * care about user privacy
   */
  PrivacyMonitor: {
    auth: NoStackAll,
    location: NoStackAll,
    shortcut: NoStackAll,
    clipboard: NoStackAll,
    activity: NoStackAll,
  },

  /**
   * 1. widget & shorcut
   * 2. applciation auto start & background window
   */
  MaliciousAppMonitor: {
    activity: NoStackAll,
    jobscheduler: StackAll,
    appops: StackAll,
    input: StackAll,
    alarm: StackAll,
    package: StackAll,
    launcherapps: StackAll,
    input_method: StackAll,
    notification: StackAll,
    shortcut: StackAll,
    account: StackAll,
  },
} as const
