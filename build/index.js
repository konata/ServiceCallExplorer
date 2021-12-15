(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
(function (setImmediate,clearImmediate){(function (){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this)}).call(this,require("timers").setImmediate,require("timers").clearImmediate)

},{"process/browser.js":1,"timers":2}],3:[function(require,module,exports){
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Predefined = exports.NoStackAll = exports.StackAll = exports.instrument = exports.vinstrument = void 0;
function resolveOverloads(clazz, restriction) {
    var uniqueMethods = Array.from(new Set(clazz.getDeclaredMethods().map(function (it) { return it.getName(); })));
    var klazz = Java.use(clazz.getName());
    return uniqueMethods
        .map(function (methodName) {
        var _a;
        return [
            methodName,
            (_a = restriction.find(function (_a) {
                var pattern = _a.pattern;
                return methodName.match(pattern);
            })) === null || _a === void 0 ? void 0 : _a.noisy,
        ];
    })
        .filter(function (_a) {
        var _b = __read(_a, 2), trace = _b[1];
        return trace != undefined;
    })
        .flatMap(function (_a) {
        var _b = __read(_a, 2), name = _b[0], trace = _b[1];
        return klazz[name].overloads.map(function (handle) { return [name, trace == true, handle]; });
    });
}
function vinstrument() {
    var services = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        services[_i] = arguments[_i];
    }
    return instrument(services);
}
exports.vinstrument = vinstrument;
function instrument(services, tracer) {
    if (tracer === void 0) { tracer = console.log.bind(console); }
    var ActivityThread = Java.use('android.app.ActivityThread');
    var currentActivityThread = ActivityThread.currentActivityThread();
    var SystemServiceRegistry = Java.use('android.app.SystemServiceRegistry');
    var systemContext = currentActivityThread.getSystemUiContext();
    var JObject = Java.use('java.lang.Object');
    var Log = Java.use('android.util.Log');
    var Exception = Java.use('java.lang.Exception');
    var Process = Java.use('android.os.Process');
    var normalized = 'length' in services
        ? services.reduce(function (acc, ele) {
            var _a;
            return (__assign(__assign({}, acc), (_a = {}, _a[ele] = undefined, _a)));
        }, {})
        : services;
    var keys = Object.keys(normalized);
    var proxies = keys
        .map(function (it) {
        return [it, SystemServiceRegistry.getSystemService(systemContext, it)];
    })
        .filter(function (_a) {
        var _b = __read(_a, 2), value = _b[1];
        return Boolean(value);
    });
    var found = proxies.map(function (_a) {
        var _b = __read(_a, 1), key = _b[0];
        return key;
    });
    var dropped = keys.filter(function (it) { return !found.includes(it); });
    tracer("trace on thread: ".concat(Process.myPid()));
    tracer("dropped services(".concat(dropped.length, "): ").concat(dropped));
    proxies.forEach(function (_a) {
        var _b = __read(_a, 2), key = _b[0], it = _b[1];
        var rule = normalized[key];
        var restriction = (!!rule ? ('length' in rule ? rule : [rule]) : [/.*/]) // set default rule
            .map(function (r) {
            return 'noisy' in r
                ? r
                : {
                    noisy: false,
                    pattern: r,
                };
        }); // set default stacktrace
        var resolvedMethods = resolveOverloads(it.getClass(), restriction);
        // normalize nested services inside `ActivityManager` & strip proxy calls
        if (key == 'activity') {
            var klazz = Java.use(it.getClass().getName());
            var ActivityManagerStubProxy = JObject.getClass.call(klazz.getService());
            var TaskManagerStubProxy = JObject.getClass.call(klazz.getTaskService());
            // application thread callbacks
            var ApplicationThreadStub = JObject.getClass.call(currentActivityThread.getApplicationThread());
            var delegated_1 = __spreadArray(__spreadArray(__spreadArray([], __read(resolveOverloads(ActivityManagerStubProxy, restriction)), false), __read(resolveOverloads(TaskManagerStubProxy, restriction)), false), __read(resolveOverloads(ApplicationThreadStub, restriction.map(function (it) { return (__assign(__assign({}, it), { noisy: false })); }) // callbacks form AMS does not need stack at all, cause it's fixed
            )), false);
            // remove getService
            resolvedMethods = resolvedMethods.filter(function (_a) {
                var _b = __read(_a, 1), it = _b[0];
                return it != 'getService';
            });
            // remove duplicate calls & merge
            resolvedMethods = __spreadArray(__spreadArray([], __read(resolvedMethods.filter(function (_a) {
                var _b = __read(_a, 1), it = _b[0];
                return !delegated_1.some(function (_a) {
                    var _b = __read(_a, 1), name = _b[0];
                    return name == it;
                });
            })), false), __read(delegated_1), false);
        }
        resolvedMethods.forEach(function (_a) {
            var _b = __read(_a, 3), name = _b[0], stack = _b[1], overload = _b[2];
            overload.implementation = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var returns = overload.apply(this, args);
                tracer("@@@".concat(this, " #").concat(name, " (").concat(args, "): ").concat(returns));
                if (stack) {
                    tracer("stack: ".concat(Log.getStackTraceString(Exception.$new())));
                }
                return returns;
            };
        });
    });
}
exports.instrument = instrument;
exports.StackAll = {
    pattern: /.*/,
    noisy: true,
};
exports.NoStackAll = {
    pattern: /.*/,
    noisy: false,
};
exports.Predefined = {
    /**
     * rule for wander around an app, no specific purpose
     */
    JustWander: {
        alarm: exports.NoStackAll,
        activity: exports.NoStackAll,
        package: exports.NoStackAll,
        appops: exports.NoStackAll,
        input_method: exports.NoStackAll,
        location: exports.NoStackAll,
        shortcut: exports.NoStackAll,
    },
    /**
     * care about user privacy
     */
    PrivacyMonitor: {
        auth: exports.NoStackAll,
        location: exports.NoStackAll,
        shortcut: exports.NoStackAll,
        clipboard: exports.NoStackAll,
        activity: exports.NoStackAll,
    },
    /**
     * 1. widget & shortcut
     * 2. application auto start & background window
     */
    MaliciousAppMonitor: {
        activity: exports.NoStackAll,
        jobscheduler: exports.StackAll,
        appops: exports.StackAll,
        input: exports.StackAll,
        alarm: exports.StackAll,
        package: exports.StackAll,
        launcherapps: exports.StackAll,
        input_method: exports.StackAll,
        notification: exports.StackAll,
        shortcut: exports.StackAll,
        account: exports.StackAll,
    },
};

},{}],4:[function(require,module,exports){
"use strict";
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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.penetrate = void 0;
function penetrate(tracer, fatal) {
    var _a = (function () {
        var log = [];
        return {
            contains: function (seq) { return log.map(function (it) { return it.seq; }).includes(seq); },
            append: function (data) {
                log.unshift(data);
                var _a = __read(log, 2), last = _a[0], secondLast = _a[1];
                if (last.type == 'proc' &&
                    ['activity', 'service', 'provider'].includes(secondLast === null || secondLast === void 0 ? void 0 : secondLast.type)) {
                    fatal("".concat(secondLast.message, "\n").concat(last.message, "\n\n"));
                }
                else if (last.type == 'broadcast' && (secondLast === null || secondLast === void 0 ? void 0 : secondLast.type) == 'proc') {
                    fatal("".concat(last.message, "\n").concat(secondLast.message, "\n\n"));
                }
            },
        };
    })(), contains = _a.contains, append = _a.append;
    var Sig = {
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
    };
    var ProcessList = Java.use(Sig.ProcessList);
    var ProcessRecord = Java.use(Sig.ProcessRecord);
    var HostingRecord = Java.use(Sig.HostingRecord);
    var ActivityStackSupervisor = Java.use(Sig.ActivityStackSupervisor);
    // [Process]
    ProcessList.startProcessLocked.overload(Sig.ProcessRecord, Sig.HostingRecord, Sig.int, Sig.boolean, Sig.boolean, Sig.boolean, Sig.String).implementation = function (process, hosting, zygotePolicyFlag, disableHiddenApiCheck, disableTestApiCheck, mountExtStorageFull, abiOverride) {
        var args = [
            process,
            hosting,
            zygotePolicyFlag,
            disableHiddenApiCheck,
            disableTestApiCheck,
            mountExtStorageFull,
            abiOverride,
        ];
        var returns = this.startProcessLocked.apply(this, __spreadArray([], __read(args), false));
        var startSeq = process.startSeq.value;
        var procMessage = "[Must] Start proc: for ".concat(hosting.mHostingName.value, ", because: ").concat(hosting.mHostingType.value, ", pid: ").concat(process.pid.value, " startSeq:").concat(process.startSeq.value);
        tracer(procMessage);
        if (!contains(startSeq)) {
            append({
                type: 'proc',
                seq: startSeq,
                target: hosting.mHostingName.value,
                reason: hosting.mHostingType.value,
                message: procMessage,
            });
        }
        else {
            console.warn("drop duplicate startSeq: ".concat(startSeq));
        }
        return returns;
    };
    // hook four kinds of callers
    var ActivityManagerService = Java.use(Sig.ActivityManagerService);
    var ActiveServices = Java.use(Sig.ActiveService);
    var BroadcastQueue = Java.use(Sig.BroadcastQueue);
    var ActivityStack = Java.use(Sig.ActivityStack);
    var ActivityStarter = Java.use(Sig.ActivityStarter);
    // [Provider]
    ActivityManagerService.getContentProviderImpl.implementation = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var _a = __read(args, 7), name = _a[1], callingPackage = _a[4], callingTag = _a[5], stable = _a[6];
        var providerMessage = "[May] Start provider: ".concat(name, " by ").concat(callingPackage);
        tracer(providerMessage);
        append({
            by: callingPackage,
            type: 'provider',
            message: providerMessage,
            target: name,
        });
        return this.getContentProviderImpl.apply(this, __spreadArray([], __read(args), false));
    };
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
    ActiveServices.startServiceLocked.overload(Sig.IApplicationThread, Sig.Intent, Sig.String, Sig.int, Sig.int, Sig.boolean, Sig.String, Sig.String, Sig.int, Sig.boolean).implementation = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var _a = __read(args, 10), caller = _a[0], intent = _a[1], resolvedType = _a[2], callingPid = _a[3], callingUid = _a[4], fgRequired = _a[5], callingPackage = _a[6], callingFeatureId = _a[7], userId = _a[8], allowBackgroundActivityStart = _a[9];
        var message = "[May] Start service ".concat(intent, " by ").concat(callingPackage);
        tracer(message);
        append({
            by: callingPackage,
            type: 'service',
            message: message,
            target: intent,
        });
        return this.startServiceLocked.apply(this, __spreadArray([], __read(args), false));
    };
    // [BindService]
    ActiveServices.bindServiceLocked.implementation = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var _a = __read(args, 9), caller = _a[0], token = _a[1], intent = _a[2], resolvedType = _a[3], connection = _a[4], flags = _a[5], instanceName = _a[6], callingPackage = _a[7], userId = _a[8];
        var bindServiceMessage = "[May] Bind service ".concat(intent, " by ").concat(callingPackage);
        tracer(bindServiceMessage);
        append({
            by: callingPackage,
            type: 'service',
            message: bindServiceMessage,
            target: intent,
        });
        return this.bindServiceLocked.apply(this, __spreadArray([], __read(args), false));
    };
    // [Activity]
    ActivityStarter.executeRequest.implementation = function (request) {
        var startActivityMessage = "[May] Start activity(executeRequest):".concat(request.intent.value, " by:").concat(request.callingPackage.value, " resultTo:").concat(request.resultWho);
        tracer(startActivityMessage);
        append({
            by: request.callingPackage.value,
            type: 'activity',
            message: startActivityMessage,
            target: request.intent.value,
        });
        return this.executeRequest(request);
    };
    // [Broadcast]
    BroadcastQueue.maybeAddAllowBackgroundActivityStartsToken.implementation =
        function (process, broadcast) {
            var broadcastMessage = "[May & After] Start broadcast:".concat(broadcast.intent.value, "  by: ").concat(broadcast.callerPackage.value);
            tracer(broadcastMessage);
            append({
                by: broadcast.callerPackage.value,
                type: 'broadcast',
                message: broadcastMessage,
                target: broadcast.intent.value,
            });
            return this.maybeAddAllowBackgroundActivityStartsToken(process, broadcast);
        };
}
exports.penetrate = penetrate;

},{}],5:[function(require,module,exports){
(function (setImmediate){(function (){
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var SpawnExplorer_1 = require("./SpawnExplorer");
var ServiceCallExplorer_1 = require("./ServiceCallExplorer");
// demonstrates service call usage
function ServiceCallUsage() {
    // customize service & pattern
    (0, ServiceCallExplorer_1.instrument)({
        content: [
            {
                pattern: /.*query.*/,
                noisy: false,
            },
            {
                pattern: /.*delete.*/,
                noisy: true,
            },
        ],
    }, console.log.bind(console));
    // instrument all methods inside below services
    (0, ServiceCallExplorer_1.vinstrument)('activity', 'activity_task', 'package', 'notification', 'alarm', 'appwidget', 'appops');
    // by utilizing predefined configuration
    (0, ServiceCallExplorer_1.instrument)(ServiceCallExplorer_1.Predefined.MaliciousAppMonitor);
    // overwritten predefined configurations
    (0, ServiceCallExplorer_1.instrument)(__assign(__assign({}, ServiceCallExplorer_1.Predefined.PrivacyMonitor), { activity: ServiceCallExplorer_1.NoStackAll }));
}
// demonstrate ProcExplorer
function demonstrateProcExplorer() {
    (0, SpawnExplorer_1.penetrate)(function () { }, console.error.bind(console));
}
// entrance
setImmediate(function () {
    Java.perform(demonstrateProcExplorer);
});

}).call(this)}).call(this,require("timers").setImmediate)

},{"./ServiceCallExplorer":3,"./SpawnExplorer":4,"timers":2}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3RpbWVycy1icm93c2VyaWZ5L21haW4uanMiLCJzcmMvU2VydmljZUNhbGxFeHBsb3Jlci50cyIsInNyYy9TcGF3bkV4cGxvcmVyLnRzIiwic3JjL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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
