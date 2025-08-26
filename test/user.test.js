const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;
const Review = require('../models/Review');

describe('Submit Review', () => {
  let req, res, statusStub, jsonStub;

  beforeEach(() => {
    req = {
      body: {
        bookingId: 'abc123',
        barberId: 'barber456',
        userId: 'user789',
        reviewText: 'Great service!',
        rating: 5
      }
    };
    jsonStub = sinon.stub();
    statusStub = sinon.stub().returns({ json: jsonStub });
    res = { status: statusStub };

    sinon.stub(Review.prototype, 'save').resolvesThis();
  });

  afterEach(() => sinon.restore());

  it('should submit a review and return success', async () => {
    const submitReview = async (req, res) => {
      try {
        const review = new Review(req.body);
        await review.save();
        return res.status(201).json({ msg: 'Review submitted', review });
      } catch (err) {
        return res.status(500).json({ msg: 'Server error' });
      }
    };

    await submitReview(req, res);
    expect(statusStub.calledWith(201)).to.be.true;
    expect(jsonStub.calledWithMatch({ msg: 'Review submitted' })).to.be.true;
  });
});
