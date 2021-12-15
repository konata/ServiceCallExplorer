import { penetrate } from './SpawnExplorer'
import {
  instrument,
  vinstrument,
  Predefined,
  StackAll,
  NoStackAll,
} from './ServiceCallExplorer'

// demonstrates service call usage
function ServiceCallUsage() {
  // customize service & pattern
  instrument(
    {
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
    },
    console.log.bind(console)
  )

  // instrument all methods inside below services
  vinstrument(
    'activity',
    'activity_task',
    'package',
    'notification',
    'alarm',
    'appwidget',
    'appops'
  )

  // by utilizing predefined configuration
  instrument(Predefined.MaliciousAppMonitor)

  // overwritten predefined configurations
  instrument({
    ...Predefined.PrivacyMonitor,
    activity: NoStackAll,
  })
}

// demonstrate ProcExplorer
function demonstrateProcExplorer() {
  penetrate(() => {}, console.error.bind(console))
}

// entrance
setImmediate(() => {
  Java.perform(demonstrateProcExplorer)
})
