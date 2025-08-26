// const chai = require("chai");
// const sinon = require("sinon");
// const expect = chai.expect;

// // Fake Barber model
// const Barber = {
//   findByIdAndUpdate: sinon.stub()
// };

// // Local function definition for testing
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

// describe("updateAvailabilityStatus()", () => {
//   afterEach(() => {
//     sinon.restore();
//     Barber.findByIdAndUpdate.reset(); // Reset stub call history
//   });

//   it("should throw error for invalid status", async () => {
//     try {
//       await updateAvailabilityStatus("abc123", "Offline");
//     } catch (err) {
//       expect(err.message).to.equal("Invalid status");
//     }
//   });

//   it("should throw error if barber not found", async () => {
//     Barber.findByIdAndUpdate.resolves(null);

//     try {
//       await updateAvailabilityStatus("abc123", "Available");
//     } catch (err) {
//       expect(err.message).to.equal("Barber not found");
//     }
//   });

//   it("should return updated barber object", async () => {
//     const mockBarber = { _id: "abc123", name: "Test Barber", availabilityStatus: "Available" };
//     Barber.findByIdAndUpdate.resolves(mockBarber);

//     const result = await updateAvailabilityStatus("abc123", "Available");
//     expect(result).to.deep.equal(mockBarber);
//   });
// });
