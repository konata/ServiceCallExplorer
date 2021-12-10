import {
  instrument,
  vinstrument,
  Predefined,
  StackAll,
  NoStackAll,
} from './libs/services'

setImmediate(() => {
  Java.perform(() => {
    // instrument(
    //   {
    //     content: [
    //       {
    //         pattern: /.*query.*/,
    //         noisy: false,
    //       },
    //       {
    //         pattern: /.*delete.*/,
    //         noisy: true,
    //       },
    //     ],
    //   },
    //   console.log.bind(console)
    // )

    // vinstrument(
    //   'activity',
    //   'activity_task',
    //   'package',
    //   'notification',
    //   'alarm',
    //   'appwidget',
    //   'appops'
    // )

    // const { appops, ...rst } = Predefined.MaliciousAppMonitor
    vinstrument('activity')
  })
})
