// const chai = require('chai');
// const chaiHttp = require('chai-http'); // ✅ Make sure this line is exact
// const { app } = require('../server'); // ✅ Your Express app

// chai.use(chaiHttp); // ✅ This fails if chaiHttp is not a function

// const expect = chai.expect;

// describe('Admin Panel Health Check', () => {
//   it('should return 401 Unauthorized if no token is provided', (done) => {
//     chai.request(app)
//       .get('/admin/dashboard')
//       .end((err, res) => {
//         expect(res).to.have.status(401); // because token is missing
//         done();
//       });
//   });
// });
