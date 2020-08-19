function combination(source = [], selectedLimit, isPermutation = true) {
  if (!Array.isArray(source)) return source
  // remove duplicated item
  source = [...new Set(source)]
  selectedLimit = selectedLimit || source.length
  const result = []
  const sourceLen = source.length
  selectedLimit = selectedLimit > sourceLen ? sourceLen : selectedLimit
  const innerLoop = (prefix = [], done = [], index = 0) => {
      const prefixLen = prefix.length
      for (let i = isPermutation ? 0 : index; i < sourceLen; i++) {
          if (prefixLen > selectedLimit - 1) break
          // Optimization: Continue to next cycle if current item has be already used for 'prefix'.
          if (done.includes(i)) continue
          const item = source[i]
          const newItem = [...prefix, item]
          if (prefixLen === selectedLimit - 1) {
              result.push(newItem)
          }
          if (prefixLen < selectedLimit - 1) {
              innerLoop(newItem, [...done, i], index++)
          }
      }
  }

  if (source.length) {
      // there is only one case if we want to select all items from source by combination.
      if (!isPermutation && selectedLimit === sourceLen) {
          return source
      }
      innerLoop()
  }
  return result
}

module.exports = {
  combination: combination
}