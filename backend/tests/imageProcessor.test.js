const ImageProcessor = require('../utils/imageProcessor');

describe('ImageProcessor', () => {
  test('should preprocess image', () => {
    const mockImageBuffer = Buffer.from('test image data');
    const result = ImageProcessor.preprocessImage(mockImageBuffer);
    
    expect(result).toHaveProperty('processed', true);
    expect(result).toHaveProperty('width');
    expect(result).toHaveProperty('height');
    expect(result).toHaveProperty('timestamp');
  });

  test('should detect parking spaces', () => {
    const mockProcessedImage = {
      width: 800,
      height: 600
    };
    const spaces = ImageProcessor.detectParkingSpaces(mockProcessedImage);
    
    expect(Array.isArray(spaces)).toBe(true);
    expect(spaces.length).toBeGreaterThan(0);
    expect(spaces[0]).toHaveProperty('id');
    expect(spaces[0]).toHaveProperty('x');
    expect(spaces[0]).toHaveProperty('y');
    expect(spaces[0]).toHaveProperty('width');
    expect(spaces[0]).toHaveProperty('height');
  });

  test('should recognize space status', () => {
    const mockImageBuffer = Buffer.from('test image data');
    const mockSpaces = [
      { id: 'space_1', x: 50, y: 50, width: 60, height: 60 },
      { id: 'space_2', x: 120, y: 50, width: 60, height: 60 }
    ];
    
    const statuses = ImageProcessor.recognizeSpaceStatus(mockImageBuffer, mockSpaces);
    
    expect(Array.isArray(statuses)).toBe(true);
    expect(statuses.length).toBe(2);
    expect(statuses[0]).toHaveProperty('spaceId', 'space_1');
    expect(statuses[0]).toHaveProperty('position');
    expect(statuses[0]).toHaveProperty('status');
    expect(statuses[0]).toHaveProperty('confidence');
    
    // 验证状态值是否有效
    const validStatuses = ['空闲', '占用', '预定'];
    expect(validStatuses).toContain(statuses[0].status);
    
    // 验证置信度范围
    expect(statuses[0].confidence).toBeGreaterThanOrEqual(0.7);
    expect(statuses[0].confidence).toBeLessThanOrEqual(1);
  });

  test('should post-process results', () => {
    const mockStatuses = [
      {
        spaceId: 'space_1',
        position: { x: 50, y: 50 },
        status: '空闲',
        confidence: 1.2 // 故意设置超过1的置信度
      }
    ];
    
    const processedStatuses = ImageProcessor.postProcessResults(mockStatuses);
    
    expect(Array.isArray(processedStatuses)).toBe(true);
    expect(processedStatuses.length).toBe(1);
    // 验证置信度被修正为不超过1
    expect(processedStatuses[0].confidence).toBeLessThanOrEqual(1);
    // 验证添加了处理时间戳
    expect(processedStatuses[0]).toHaveProperty('processedAt');
  });
});