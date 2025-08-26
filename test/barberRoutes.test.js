// const chai = require('chai');
// const chaiHttp = require('chai-http');
// const jwt = require('jsonwebtoken');
// const { app } = require('../server');
// const Barber = require('../models/Barber');

// chai.use(chaiHttp);
// const expect = chai.expect;

// describe('Barber Routes - Integration', () => {
//   let token, barberId;

//   before(async () => {
//     const barber = await Barber.findOne(); // use existing barber
//     barberId = barber._id;
//     token = jwt.sign({ id: barberId, role: 'barber' }, process.env.JWT_SECRET, { expiresIn: '1h' });
//   });

//   it('should return appointments for a barber', (done) => {
//     chai.request(app)
//       .get(`/barber/${barberId}/appointments`)
//       .set('Authorization', `Bearer ${token}`)
//       .end((err, res) => {
//         expect(res).to.have.status(200);
//         expect(res.body).to.be.an('array');
//         done();
//       });
//   });
// });
