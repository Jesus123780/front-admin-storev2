import { createHash } from 'node:crypto'
import { getDeviceId } from './getDeviceId'

/**
 * Mock clientjs so we can control getFingerprint output.
 */
const mockGetFingerprint = jest.fn()

jest.mock('clientjs', () => {
  return {
    ClientJS: jest.fn().mockImplementation(() => ({
      getFingerprint: mockGetFingerprint,
    })),
  }
})

/**
 * Install a mock Web Crypto API that computes SHA-256 using Node's crypto.
 */
const originalCrypto = globalThis.crypto as unknown

function bufferFrom(data: ArrayBuffer | ArrayBufferView): Buffer {
  if (data instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(data))
  }
  const view = data
  return Buffer.from(new Uint8Array(view.buffer, view.byteOffset, view.byteLength))
}

beforeAll(() => {
  const subtle = {
    digest: jest.fn(async (_algorithm: AlgorithmIdentifier, data: ArrayBuffer | ArrayBufferView) => {
      const buf = bufferFrom(data)
      const nodeBuf = createHash('sha256').update(buf).digest()
      return nodeBuf.buffer.slice(nodeBuf.byteOffset, nodeBuf.byteOffset + nodeBuf.byteLength)
    }),
  }

  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: { subtle },
  })
})

afterAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: originalCrypto,
  })
})

function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex')
}

describe('getDeviceId', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('hashes the client fingerprint and returns a lowercase hex string', async () => {
    const fingerprint = 'abc123'
    const expected = sha256Hex(fingerprint)
    mockGetFingerprint.mockReturnValue(fingerprint)

    const result = await getDeviceId()

    expect(mockGetFingerprint).toHaveBeenCalled()
    expect(result).toBe(expected)
    expect(result).toMatch(/^[0-9a-f]{64}$/)
  })

  it('treats numeric fingerprint as string before hashing', async () => {
    const numericFingerprint = 456
    const expected = sha256Hex(String(numericFingerprint))
    mockGetFingerprint.mockReturnValue(numericFingerprint)

    const result = await getDeviceId()

    expect(result).toBe(expected)
  })

  it('returns the same hash for repeated calls with the same fingerprint', async () => {
    const fingerprint = 'stable_fingerprint'
    const expected = sha256Hex(fingerprint)
    mockGetFingerprint.mockReturnValue(fingerprint)

    const a = await getDeviceId()
    const b = await getDeviceId()

    expect(a).toBe(expected)
    expect(b).toBe(expected)
  })

  it('produces different hashes for different fingerprints', async () => {
    const f1 = 'first'
    const f2 = 'second'
    const expected1 = sha256Hex(f1)
    const expected2 = sha256Hex(f2)

    mockGetFingerprint.mockReset()
    mockGetFingerprint.mockReturnValueOnce(f1).mockReturnValueOnce(f2)

    const r1 = await getDeviceId()
    const r2 = await getDeviceId()

    expect(r1).toBe(expected1)
    expect(r2).toBe(expected2)
    expect(r1).not.toBe(r2)
  })
})