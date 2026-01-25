import http from './http';

describe('http utility', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        globalThis.fetch = jest.fn();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        jest.clearAllMocks();
    });

    it('should perform a GET request and return data', async () => {
        const mockData = { success: true };
        (globalThis.fetch as jest.Mock).mockResolvedValue({
            json: jest.fn().mockResolvedValue(mockData)
        });

        const result = await http.get('/test');
        expect(globalThis.fetch).toHaveBeenCalledWith(
            'http://localhost:4000/test',
            { method: 'GET', mode: 'cors' }
        );
        expect(result).toEqual(mockData);
    });

    it('should perform a POST request and return data', async () => {
        const mockData = { created: true };
        const body = { name: 'item' };
        (global.fetch as jest.Mock).mockResolvedValue({
            json: jest.fn().mockResolvedValue(mockData)
        });

        const result = await http.post('/test', body);
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:4000/test',
            {
                body: JSON.stringify(body),
                method: 'POST',
                mode: 'cors'
            }
        );
        expect(result).toEqual(mockData);
    });
});