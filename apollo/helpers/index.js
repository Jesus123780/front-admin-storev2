'use client'
export const removeDoubleQuotes = (text = '') => {
    return text?.replace(/['"]+/g, '')
}
  