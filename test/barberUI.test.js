// const chai = require('chai');
// const sinon = require('sinon');
// const expect = chai.expect;

// // Mocking the Barber model
// const Barber = require('../models/Barber');

// // REDEFINE the function LOCALLY here (no import!)
// async function updateAvailabilityStatus(barberId, status) {
//   if (!["Available", "Busy"].includes(status)) {
//     throw new Error("Invalid status");
//   }

//   const updatedBarber = await Barber.findByIdAndUpdate(
//     barberId,
//     { availabilityStatus: status },
//     { new: true }
//   );

//   if (!updatedBarber) {
//     throw new Error("Barber not found");
//   }

//   return updatedBarber;
// }

// describe('updateAvailabilityStatus()', () => {
//   afterEach(() => sinon.restore());

//   it('should throw error for invalid status', async () => {
//     try {
//       await updateAvailabilityStatus('123abc', 'Offline'); // ❌ invalid
//     } catch (err) {
//       expect(err.message).to.equal('Invalid status');
//     }
//   });

//   it('should throw error if barber not found', async () => {
//     sinon.stub(Barber, 'findByIdAndUpdate').resolves(null);

//     try {
//       await updateAvailabilityStatus('123abc', 'Available');
//     } catch (err) {
//       expect(err.message).to.equal('Barber not found');
//     }
//   });

//   it('should return updated barber object', async () => {
//     const mockBarber = { _id: '123abc', name: 'Ram', availabilityStatus: 'Available' };
//     sinon.stub(Barber, 'findByIdAndUpdate').resolves(mockBarber);

//     const result = await updateAvailabilityStatus('123abc', 'Available');
//     expect(result).to.deep.equal(mockBarber);
//   });
// });
