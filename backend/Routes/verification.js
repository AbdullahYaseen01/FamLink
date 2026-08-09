import express from 'express'
import Verify from '../Schema/varified.js'
import User from '../Schema/user.js'
import { upload } from '../Services/utils/uploadMiddleware.js'
import { authMiddleware } from '../Services/utils/middlewareAuth.js'
import { adminOnly } from '../Services/utils/adminAuth.js'
import { sendEmail } from '../Services/email/email.js'
import uploadImage from '../Services/utils/uplaodImage.js'

const router = express.Router()

router.post(
  '/',
  authMiddleware,
  upload.fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 }
  ]),
  async (req, res) => {
    const id = req.userId
    try {
      const user = await User.findById(id)
      if (!user) {
        return res.status(404).json({ message: 'User not found.' })
      }

      if (user.verified.nationalIDVer !== 'false') {
        return res.status(403).json({
          message:
            user.verified.nationalIDVer == 'underprocess'
              ? 'Your verification is underprocess'
              : 'Your id is already verified'
        })
      }

      if (!req.files || !req.files.frontImage || !req.files.backImage) {
        return res
          .status(400)
          .json({ message: 'Both front and back images are required.' })
      }

      const frontImage = req.files.frontImage[0]
      const backImage = req.files.backImage[0]

      const frontImageUrl = await uploadImage(frontImage.buffer, user.email, "front_image_")
      const backImageUrl = await uploadImage(backImage.buffer, user.email, "back_image_")

      const verificationRecord = new Verify({
        user: id,
        frontsideImage: frontImageUrl,
        backsideImage: backImageUrl
      })
      user.verified.nationalIDVer = 'underprocess'

      await user.save()
      await verificationRecord.save()

      res.status(200).json({
        message: `Your data for verification in ${user.verified.nationalIDVer}`,
        data: user.verified.nationalIDVer
      })
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  }
)

router.get('/:id', ...adminOnly, async (req, res) => {
  const { id } = req.params
  try {
    const verify = await Verify.findOne({ user: id })

    if (!verify) {
      return res.status(404).json({ message: 'Verification record not found' })
    }

    res.status(200).json({
      data: verify
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.put('/:id', ...adminOnly, async (req, res) => {
  const { id } = req.params

  try {
    // Find the verification record for the target user
    const verify = await Verify.findById(id)
    if (!verify) {
      return res.status(404).json({ message: 'Verification record not found' })
    }

    // Check if verification is already completed
    const targetUser = await User.findById(verify.user)
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' })
    }

    if (targetUser.verified?.nationalIDVer === 'true') {
      return res.status(400).json({ message: 'User is already verified' })
    }

    // Check if verification is under process
    if (targetUser.verified?.nationalIDVer != 'underprocess') {
      return res.status(400).json({
        message:
          'Verification cannot proceed. Please submit the required documents'
      })
    }

    // Update the user's verified.nationalIDVer field
    await User.findByIdAndUpdate(
      verify.user,
      { 'verified.nationalIDVer': 'true' },
      { new: true }
    )

    sendEmail(
      targetUser.email, // Email of the target user
      'Your Verification Request Has Been Approved', // Subject
      `Dear ${targetUser.name},\n\n` + // Dynamic message content
      'We are pleased to inform you that your verification request for the National ID has been successfully approved.\n\n' +
      'Thank you for your patience and cooperation during the process. If you have any questions, feel free to contact our support team.\n\n' +
      'Best regards,\nFamyLink\nSupport Team\n'
    )

    res.status(200).json({
      message: 'User verification done successfully'
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.put('/unverify/:id', ...adminOnly, async (req, res) => {
  const { id } = req.params

  try {
    // Find the verification record for the target user
    const verify = await Verify.findOneAndDelete({ _id: id })
    if (!verify) {
      return res.status(404).json({ message: 'Verification record not found' })
    }

    // Check if verification is already completed
    const targetUser = await User.findById(verify.user)
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' })
    }

    // Check if verification is under process
    if (targetUser.verified?.nationalIDVer == 'false') {
      return res.status(400).json({
        message:
          'Verification cannot proceed. Please submit the required documents'
      })
    }

    // Update the user's verified.nationalIDVer field
    const updatedUser = await User.findByIdAndUpdate(
      verify.user,
      { 'verified.nationalIDVer': 'false' },
      { new: true }
    )

    sendEmail(
      targetUser.email, // Email of the target user
      'Your Verification Request Has Been Reverted', // Subject
      `Dear ${targetUser.name},\n\n` + // Dynamic message content
      'We regret to inform you that your verification request for the National ID has been reverted. This action was taken due to incomplete or missing documentation required for the verification process.\n\n' +
      'If you believe this is a mistake or if you need further assistance, please reach out to our support team or submit the required documents to proceed with your verification.\n\n' +
      'Thank you for your understanding.\n\nBest regards,\nFamyLink\nSupport Team\n'
    )
    res.status(200).json({
      message: 'User unverified request submit successfully'
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
