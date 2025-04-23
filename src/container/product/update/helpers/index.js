/**
 * Compare two objects for deep equality.
 * 
 * @param {Object} a - First object to compare.
 * @param {Object} b - Second object to compare.
 * @returns {boolean} True if objects are equivalent, false otherwise.
 */
export const isEquivalent = (a, b) => {
    const aProps = Object.keys(a);
    const bProps = Object.keys(b);
  
    if (aProps.length !== bProps.length) {
      return false;
    }
  
    for (let prop of aProps) {
      if (a[prop] !== b[prop]) {
        return false;
      }
    }
  
    return true;
  };