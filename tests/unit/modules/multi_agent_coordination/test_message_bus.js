/**
 * Unit tests for the Message Bus component
 * 
 * @module tests/unit/modules/multi_agent_coordination/test_message_bus
 */

const { expect } = require('chai');
const sinon = require('sinon');
const MessageBus = require('../../../../src/modules/multi_agent_coordination/message_bus');

describe('Message Bus', () => {
  let messageBus;
  let mockLogger;
  let mockGovernanceExchangeProtocol;
  
  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy()
    };
    
    // Create mock governance exchange protocol
    mockGovernanceExchangeProtocol = {
      verifyAgentTaskCompliance: sinon.stub()
    };
    
    // Create message bus instance
    messageBus = new MessageBus({
      logger: mockLogger,
      governanceExchangeProtocol: mockGovernanceExchangeProtocol
    });
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('publishMessage', () => {
    it('should publish message to all subscribers', () => {
      // Create subscribers
      const subscriber1 = sinon.spy();
      const subscriber2 = sinon.spy();
      
      // Subscribe to topic
      messageBus.subscribe('context1', 'test-topic', subscriber1);
      messageBus.subscribe('context1', 'test-topic', subscriber2);
      
      // Publish message
      const message = {
        id: 'msg1',
        topic: 'test-topic',
        sender: 'agent1',
        content: 'Hello, world!'
      };
      
      const result = messageBus.publishMessage('context1', message);
      
      expect(result).to.be.true;
      expect(subscriber1.calledOnce).to.be.true;
      expect(subscriber2.calledOnce).to.be.true;
      expect(subscriber1.firstCall.args[0]).to.equal(message);
      expect(subscriber2.firstCall.args[0]).to.equal(message);
    });
    
    it('should not publish message when governance verification fails', () => {
      // Set up governance verification to fail
      mockGovernanceExchangeProtocol.verifyAgentTaskCompliance.returns({
        compliant: false,
        reason: 'Agent does not have required governance identity'
      });
      
      // Create subscriber
      const subscriber = sinon.spy();
      
      // Subscribe to topic
      messageBus.subscribe('context1', 'test-topic', subscriber);
      
      // Publish message
      const message = {
        id: 'msg1',
        topic: 'test-topic',
        sender: 'agent1',
        content: 'Hello, world!',
        requiresGovernance: true
      };
      
      const result = messageBus.publishMessage('context1', message);
      
      expect(result).to.be.false;
      expect(subscriber.called).to.be.false;
      expect(mockLogger.warn.calledOnce).to.be.true;
    });
    
    it('should publish message to specific recipient', () => {
      // Create subscribers
      const subscriber1 = sinon.spy();
      const subscriber2 = sinon.spy();
      
      // Subscribe to topic with different agent IDs
      messageBus.subscribe('context1', 'test-topic', subscriber1, 'agent1');
      messageBus.subscribe('context1', 'test-topic', subscriber2, 'agent2');
      
      // Publish message with specific recipient
      const message = {
        id: 'msg1',
        topic: 'test-topic',
        sender: 'agent3',
        recipient: 'agent1',
        content: 'Hello, agent1!'
      };
      
      const result = messageBus.publishMessage('context1', message);
      
      expect(result).to.be.true;
      expect(subscriber1.calledOnce).to.be.true;
      expect(subscriber2.called).to.be.false;
    });
    
    it('should not publish message to non-existent topic', () => {
      // Create subscriber
      const subscriber = sinon.spy();
      
      // Subscribe to topic
      messageBus.subscribe('context1', 'test-topic', subscriber);
      
      // Publish message to different topic
      const message = {
        id: 'msg1',
        topic: 'other-topic',
        sender: 'agent1',
        content: 'Hello, world!'
      };
      
      const result = messageBus.publishMessage('context1', message);
      
      expect(result).to.be.false;
      expect(subscriber.called).to.be.false;
    });
  });
  
  describe('subscribe', () => {
    it('should subscribe to topic', () => {
      // Create subscriber
      const subscriber = sinon.spy();
      
      // Subscribe to topic
      const result = messageBus.subscribe('context1', 'test-topic', subscriber);
      
      expect(result).to.be.true;
      
      // Publish message to verify subscription
      const message = {
        id: 'msg1',
        topic: 'test-topic',
        sender: 'agent1',
        content: 'Hello, world!'
      };
      
      messageBus.publishMessage('context1', message);
      
      expect(subscriber.calledOnce).to.be.true;
    });
    
    it('should subscribe to multiple topics', () => {
      // Create subscriber
      const subscriber = sinon.spy();
      
      // Subscribe to topics
      messageBus.subscribe('context1', 'topic1', subscriber);
      messageBus.subscribe('context1', 'topic2', subscriber);
      
      // Publish messages to both topics
      const message1 = {
        id: 'msg1',
        topic: 'topic1',
        sender: 'agent1',
        content: 'Hello, topic1!'
      };
      
      const message2 = {
        id: 'msg2',
        topic: 'topic2',
        sender: 'agent1',
        content: 'Hello, topic2!'
      };
      
      messageBus.publishMessage('context1', message1);
      messageBus.publishMessage('context1', message2);
      
      expect(subscriber.calledTwice).to.be.true;
      expect(subscriber.firstCall.args[0]).to.equal(message1);
      expect(subscriber.secondCall.args[0]).to.equal(message2);
    });
  });
  
  describe('unsubscribe', () => {
    it('should unsubscribe from topic', () => {
      // Create subscriber
      const subscriber = sinon.spy();
      
      // Subscribe to topic
      messageBus.subscribe('context1', 'test-topic', subscriber);
      
      // Unsubscribe from topic
      const result = messageBus.unsubscribe('context1', 'test-topic', subscriber);
      
      expect(result).to.be.true;
      
      // Publish message to verify unsubscription
      const message = {
        id: 'msg1',
        topic: 'test-topic',
        sender: 'agent1',
        content: 'Hello, world!'
      };
      
      messageBus.publishMessage('context1', message);
      
      expect(subscriber.called).to.be.false;
    });
    
    it('should return false when subscriber is not found', () => {
      // Create subscribers
      const subscriber1 = sinon.spy();
      const subscriber2 = sinon.spy();
      
      // Subscribe first subscriber
      messageBus.subscribe('context1', 'test-topic', subscriber1);
      
      // Try to unsubscribe second subscriber
      const result = messageBus.unsubscribe('context1', 'test-topic', subscriber2);
      
      expect(result).to.be.false;
    });
  });
  
  describe('getMessageHistory', () => {
    beforeEach(() => {
      // Publish some messages
      messageBus.publishMessage('context1', {
        id: 'msg1',
        topic: 'topic1',
        sender: 'agent1',
        content: 'Message 1'
      });
      
      messageBus.publishMessage('context1', {
        id: 'msg2',
        topic: 'topic2',
        sender: 'agent2',
        content: 'Message 2'
      });
      
      messageBus.publishMessage('context1', {
        id: 'msg3',
        topic: 'topic1',
        sender: 'agent3',
        content: 'Message 3'
      });
    });
    
    it('should return all messages for a context', () => {
      const history = messageBus.getMessageHistory('context1');
      
      expect(history).to.be.an('array');
      expect(history).to.have.lengthOf(3);
      expect(history[0].id).to.equal('msg1');
      expect(history[1].id).to.equal('msg2');
      expect(history[2].id).to.equal('msg3');
    });
    
    it('should filter messages by topic', () => {
      const history = messageBus.getMessageHistory('context1', { topic: 'topic1' });
      
      expect(history).to.be.an('array');
      expect(history).to.have.lengthOf(2);
      expect(history[0].id).to.equal('msg1');
      expect(history[1].id).to.equal('msg3');
    });
    
    it('should filter messages by sender', () => {
      const history = messageBus.getMessageHistory('context1', { sender: 'agent2' });
      
      expect(history).to.be.an('array');
      expect(history).to.have.lengthOf(1);
      expect(history[0].id).to.equal('msg2');
    });
    
    it('should limit number of messages returned', () => {
      const history = messageBus.getMessageHistory('context1', { limit: 2 });
      
      expect(history).to.be.an('array');
      expect(history).to.have.lengthOf(2);
      expect(history[0].id).to.equal('msg2');
      expect(history[1].id).to.equal('msg3');
    });
  });
  
  describe('getMessageMetrics', () => {
    beforeEach(() => {
      // Publish some messages
      messageBus.publishMessage('context1', {
        id: 'msg1',
        topic: 'topic1',
        sender: 'agent1',
        content: 'Message 1'
      });
      
      messageBus.publishMessage('context1', {
        id: 'msg2',
        topic: 'topic2',
        sender: 'agent2',
        content: 'Message 2'
      });
      
      messageBus.publishMessage('context1', {
        id: 'msg3',
        topic: 'topic1',
        sender: 'agent1',
        content: 'Message 3'
      });
    });
    
    it('should return message metrics for a context', () => {
      const metrics = messageBus.getMessageMetrics('context1');
      
      expect(metrics).to.be.an('object');
      expect(metrics.totalMessages).to.equal(3);
      expect(metrics.topicCounts).to.deep.equal({
        'topic1': 2,
        'topic2': 1
      });
      expect(metrics.senderCounts).to.deep.equal({
        'agent1': 2,
        'agent2': 1
      });
    });
    
    it('should return empty metrics for non-existent context', () => {
      const metrics = messageBus.getMessageMetrics('non_existent_context');
      
      expect(metrics).to.be.an('object');
      expect(metrics.totalMessages).to.equal(0);
      expect(metrics.topicCounts).to.deep.equal({});
      expect(metrics.senderCounts).to.deep.equal({});
    });
  });
});
