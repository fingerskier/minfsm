import FSM from './StateMachine.js'
import config from './test.config.js'

const fsm = new FSM(config)

const progression = [
  'start',
  'stop',
  'stop',
  'start',
  'start',
  'pause',
  'resume',
  'stop',
]


progression.forEach(action => {
  try {
    console.log('@', fsm.at)
    fsm.update()
    console.log('->', action)
    console.log('<-', fsm.act(action))
    console.log('@', fsm.at)
    fsm.update()
    console.log('@', fsm.at)
  } catch (error) {
    console.error(error)
  }
})
