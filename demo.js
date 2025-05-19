import FSM from './FSM.js'
import config from './demo.config.js'

console.clear()

const fsm = new FSM(config)

fsm.chatty = true

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

console.log(config)


await fsm.update()

for (const action of progression) {
  try {
    await fsm.act(action)
    console.log('@STATE', fsm.state(), JSON.stringify(fsm.context))

    await fsm.update()
    await fsm.update()
    await fsm.update()
  } catch (error) {
    console.error(error)
  }
}