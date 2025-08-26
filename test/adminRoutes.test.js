// const chai = require('chai');
// const chaiHttp = require('chai-http');
// const jwt = require('jsonwebtoken');
// const mongoose = require('mongoose');
// const { app } = require('../server');
// const User = require('../models/User');

// chai.use(chaiHttp);
// const expect = chai.expect;

// describe('Admin Routes Authenticated', () => {
//   let token;
//   let adminId;

//   before(async () => {
//     await mongoose.connect(process.env.MONGO_URI);

//     const admin = await User.findOne({ role: 'admin' });

//     adminId = admin._id;
//     token = jwt.sign({ id: adminId, role: 'admin' }, process.env.JWT_SECRET, {
//       expiresIn: '1h',
//     });
//   });

//   it('GET /admin/users should return user list', (done) => {
//     chai.request(app)
//       .get('/admin/users')
//       .set('Authorization', `Bearer ${token}`)
//       .end((err, res) => {
//         expect(res).to.have.status(200);
//         expect(res.body).to.be.an('array');
//         done();
//       });
//   });

//   it('GET /admin/barbers should return barber list', (done) => {
//     chai.request(app)
//       .get('/admin/barbers')
//       .set('Authorization', `Bearer ${token}`)
//       .end((err, res) => {
//         expect(res).to.have.status(200);
//         expect(res.body).to.be.an('array');
//         done();
//       });
//   });

//   it('GET /admin/revenue should return total revenue', (done) => {
//     chai.request(app)
//       .get('/admin/revenue')
//       .set('Authorization', `Bearer ${token}`)
//       .end((err, res) => {
//         expect(res).to.have.status(200);
//         expect(res.body).to.have.property('totalRevenue');
//         done();
//       });
//   });

//   it('GET /admin/stats should return platform stats', (done) => {
//     chai.request(app)
//       .get('/admin/stats')
//       .set('Authorization', `Bearer ${token}`)
//       .end((err, res) => {
//         expect(res).to.have.status(200);
//         expect(res.body).to.have.property('totalUsers');
//         expect(res.body).to.have.property('totalBarbers');
//         expect(res.body).to.have.property('totalAppointments');
//         done();
//       });
//   });
// });
