// const chai = require('chai');
// const chaiHttp = require('chai-http');
// const { app } = require('../server');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// chai.use(chaiHttp);
// const expect = chai.expect;

// describe('Integration Test - Create Barber Route', () => {
//   let token;

//   before(async () => {
//     const admin = await User.findOne({ role: 'admin' });
//     token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
//   });

//   it('should return 400 if image is not uploaded', (done) => {
//     chai.request(app)
//       .post('/admin/create-barber')
//       .set('Authorization', `Bearer ${token}`)
//       .field('name', 'Test Barber')
//       .field('email', 'newbarber@example.com')
//       .field('password', 'password123')
//       .field('location', 'Test City')
//       // no file attached intentionally
//       .end((err, res) => {
//         expect(res).to.have.status(400);
//         expect(res.body.msg).to.equal('Image is required');
//         done();
//       });
//   });
// });
