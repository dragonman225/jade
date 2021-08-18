export const Measure = (() => {
  /** Map<runner_symbol, start_timestamp> */
  const measuring = new Map<symbol, number>()

  return {
    start: () => {
      const now = Date.now()
      const runner = Symbol()
      measuring.set(runner, now)
      return runner
    },
    end: (runnerSymbol: symbol) => {
      const now = Date.now()
      const start = measuring.get(runnerSymbol)
      if (!start) {
        console.log(
          'Cannot get start time with provided "runnerSymbol", ' +
            'did you call "Measure.start()"?'
        )
        return undefined
      }
      measuring.delete(runnerSymbol)
      return now - start
    },
  }
})()
