const { checkCharactersHandler } = require('../checkerController');

// Mock the characterChecker utility
jest.mock('../../utils/characterChecker');
const { checkCharacters } = require('../../utils/characterChecker');

describe('checkerController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // ─── Input validation ────────────────────────────────────────────────────────

  describe('input validation', () => {
    it('should return 400 when input1 is missing', async () => {
      req.body = { input2: 'hello', type: 'sensitive' };

      checkCharactersHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'input1 is required',
      });
    });

    it('should return 400 when input1 is empty string', async () => {
      req.body = { input1: '', input2: 'hello', type: 'sensitive' };

      checkCharactersHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'input1 is required',
      });
    });

    it('should return 400 when input2 is missing', async () => {
      req.body = { input1: 'hello', type: 'sensitive' };

      checkCharactersHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'input2 is required',
      });
    });

    it('should return 400 when input2 is empty string', async () => {
      req.body = { input1: 'hello', input2: '', type: 'sensitive' };

      checkCharactersHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'input2 is required',
      });
    });

    it('should return 400 when type is missing', async () => {
      req.body = { input1: 'hello', input2: 'world' };

      checkCharactersHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'type is required',
      });
    });

    it('should return 400 when type is invalid', async () => {
      req.body = { input1: 'hello', input2: 'world', type: 'unknown' };

      checkCharactersHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'type must be "sensitive" or "insensitive"',
      });
    });

    it('should return 400 when input1 is not a string', async () => {
      req.body = { input1: 123, input2: 'world', type: 'sensitive' };

      checkCharactersHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'input1 and input2 must be strings',
      });
    });

    it('should return 400 when input2 is not a string', async () => {
      req.body = { input1: 'hello', input2: 456, type: 'sensitive' };

      checkCharactersHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'input1 and input2 must be strings',
      });
    });
  });

  // ─── Case-sensitive matching ─────────────────────────────────────────────────

  describe('case-sensitive matching', () => {
    it('should call checkCharacters with type=sensitive and return result', () => {
      req.body = { input1: 'ABBCD', input2: 'Gallant Duck', type: 'sensitive' };

      const mockResult = {
        input1: 'ABBCD',
        input2: 'Gallant Duck',
        type: 'sensitive',
        matched: 1,
        total: 5,
        percentage: 20.0,
      };
      checkCharacters.mockReturnValue(mockResult);

      checkCharactersHandler(req, res);

      expect(checkCharacters).toHaveBeenCalledWith('ABBCD', 'Gallant Duck', 'sensitive');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Character check completed successfully',
        data: mockResult,
      });
    });

    it('should match exact case only for type=sensitive', () => {
      req.body = { input1: 'abc', input2: 'ABC', type: 'sensitive' };

      const mockResult = {
        input1: 'abc',
        input2: 'ABC',
        type: 'sensitive',
        matched: 0,
        total: 3,
        percentage: 0.0,
      };
      checkCharacters.mockReturnValue(mockResult);

      checkCharactersHandler(req, res);

      expect(checkCharacters).toHaveBeenCalledWith('abc', 'ABC', 'sensitive');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ matched: 0, percentage: 0.0 }),
        })
      );
    });
  });

  // ─── Case-insensitive matching ───────────────────────────────────────────────

  describe('case-insensitive matching', () => {
    it('should call checkCharacters with type=insensitive and return result', () => {
      req.body = { input1: 'ABBCD', input2: 'Gallant Duck', type: 'insensitive' };

      const mockResult = {
        input1: 'ABBCD',
        input2: 'Gallant Duck',
        type: 'insensitive',
        matched: 3,
        total: 5,
        percentage: 60.0,
      };
      checkCharacters.mockReturnValue(mockResult);

      checkCharactersHandler(req, res);

      expect(checkCharacters).toHaveBeenCalledWith('ABBCD', 'Gallant Duck', 'insensitive');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Character check completed successfully',
        data: mockResult,
      });
    });

    it('should match regardless of case for type=insensitive', () => {
      req.body = { input1: 'abc', input2: 'ABC', type: 'insensitive' };

      const mockResult = {
        input1: 'abc',
        input2: 'ABC',
        type: 'insensitive',
        matched: 3,
        total: 3,
        percentage: 100.0,
      };
      checkCharacters.mockReturnValue(mockResult);

      checkCharactersHandler(req, res);

      expect(checkCharacters).toHaveBeenCalledWith('abc', 'ABC', 'insensitive');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ matched: 3, percentage: 100.0 }),
        })
      );
    });
  });

  // ─── Percentage calculation ──────────────────────────────────────────────────

  describe('percentage calculation', () => {
    it('should return percentage rounded to 2 decimal places', () => {
      req.body = { input1: 'abc', input2: 'ab', type: 'sensitive' };

      const mockResult = {
        input1: 'abc',
        input2: 'ab',
        type: 'sensitive',
        matched: 2,
        total: 3,
        percentage: 66.67,
      };
      checkCharacters.mockReturnValue(mockResult);

      checkCharactersHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ percentage: 66.67 }),
        })
      );
    });

    it('should return 0 percentage when no characters match', () => {
      req.body = { input1: 'xyz', input2: 'abc', type: 'sensitive' };

      const mockResult = {
        input1: 'xyz',
        input2: 'abc',
        type: 'sensitive',
        matched: 0,
        total: 3,
        percentage: 0.0,
      };
      checkCharacters.mockReturnValue(mockResult);

      checkCharactersHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ matched: 0, percentage: 0.0 }),
        })
      );
    });

    it('should return 100 percentage when all characters match', () => {
      req.body = { input1: 'abc', input2: 'abcdef', type: 'sensitive' };

      const mockResult = {
        input1: 'abc',
        input2: 'abcdef',
        type: 'sensitive',
        matched: 3,
        total: 3,
        percentage: 100.0,
      };
      checkCharacters.mockReturnValue(mockResult);

      checkCharactersHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ matched: 3, percentage: 100.0 }),
        })
      );
    });
  });

  // ─── Response format ─────────────────────────────────────────────────────────

  describe('response format', () => {
    it('should return standardized response format { success, message, data }', () => {
      req.body = { input1: 'hello', input2: 'world', type: 'sensitive' };

      const mockResult = {
        input1: 'hello',
        input2: 'world',
        type: 'sensitive',
        matched: 3,
        total: 5,
        percentage: 60.0,
      };
      checkCharacters.mockReturnValue(mockResult);

      checkCharactersHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const responseArg = res.json.mock.calls[0][0];
      expect(responseArg).toHaveProperty('success', true);
      expect(responseArg).toHaveProperty('message');
      expect(responseArg).toHaveProperty('data');
    });

    it('should include input1, input2, type, matched, total, percentage in data', () => {
      req.body = { input1: 'hello', input2: 'world', type: 'sensitive' };

      const mockResult = {
        input1: 'hello',
        input2: 'world',
        type: 'sensitive',
        matched: 3,
        total: 5,
        percentage: 60.0,
      };
      checkCharacters.mockReturnValue(mockResult);

      checkCharactersHandler(req, res);

      const responseArg = res.json.mock.calls[0][0];
      expect(responseArg.data).toHaveProperty('input1', 'hello');
      expect(responseArg.data).toHaveProperty('input2', 'world');
      expect(responseArg.data).toHaveProperty('type', 'sensitive');
      expect(responseArg.data).toHaveProperty('matched');
      expect(responseArg.data).toHaveProperty('total');
      expect(responseArg.data).toHaveProperty('percentage');
    });

    it('should return success: false on utility error', () => {
      req.body = { input1: 'hello', input2: 'world', type: 'sensitive' };

      checkCharacters.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      checkCharactersHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error performing character check',
      });
    });
  });
});
