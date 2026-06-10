import { CloseOutlined } from '@ant-design/icons'
import { useState, useRef } from 'react'
import { Radio } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import HireStep1 from '../subComponents/Hire/step1'
import HireStep2 from '../subComponents/Hire/step2'
import { InputRadio } from '../subComponents/input'
import { fireToastMessage } from '../../toastContainer'
import HireStep3 from '../subComponents/Hire/step3'
import HireStep4 from '../subComponents/Hire/step4'
import quesMark from '../../assets/images/quesMark.png'
import NannyNoStep2 from '../subComponents/Hire/NannyShareNo/step2'
import MultiFormContainer from '../subComponents/Hire/MultipleChoice/multipleChoice'
import MultiFormContainerCheck from '../subComponents/Hire/MultipleChoice/MultipleChoiceCheck'
import { toCamelCase } from '../subComponents/toCamelStr'
import AddSer from '../subComponents/Hire/NannyShareNo/addSer'
import { Form, Input } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { setAddSer } from '../Redux/setAddtional'
import Tutor from '../subComponents/Hire/NannyShareNo/AdditionalStep.jsx/tutor'
import HouseManager from '../subComponents/Hire/NannyShareNo/AdditionalStep.jsx/houseMang'
import Music from '../subComponents/Hire/NannyShareNo/AdditionalStep.jsx/music'
import SpecialCaregiver from '../subComponents/Hire/NannyShareNo/AdditionalStep.jsx/specializedCare'
import Swim from '../subComponents/Hire/NannyShareNo/AdditionalStep.jsx/swim'
import SportCoach from '../subComponents/Hire/NannyShareNo/AdditionalStep.jsx/sportCoach'
import { addOrUpdateAdditionalInfo, updateForm } from '../Redux/formValue'
import { registerThunk } from '../Redux/authSlice'
import { NavLink } from 'react-router-dom'
import { api } from '../../Config/api'
import Button from '../../NewComponents/Button'
export default function HireForm() {
  const { pathname } = useLocation()
  const [form] = Form.useForm()
  const dispatch = useDispatch()
  const [isDisabled, setIsDisabled] = useState(true)
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // Manage current step
  const hireStep1FormRef = useRef(null) // Form reference for HireStep1
  const hireStep2FormRef = useRef(null) // Form reference for
  const hireStep4FormRef = useRef(null)
  const [selectedValue, setSelectedValue] = useState(null)
  const v = useSelector(s => s.additionalSer)
  const val = useSelector(s => s.form)
  // Access the inner object using v.value
  const innerObject = v.value

  // Get all the boolean values as an array
  const valuesArray = Object.values(innerObject)

  // Count the number of true values
  const trueCount = valuesArray.filter(value => value === true).length

  const handleSelectChange = value => {
    setSelectedValue(value)
  }

  const handleGoBack = () => {
    navigate('/joinNow') // Navigate back in history
  }

  // Toggle disabled state
  const toggleButton = () => {
    setIsDisabled(false)
  }

  const [textAreaValue, setTextAreaValue] = useState(
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
  )
  const Register = async () => {
    const beforeAddInfo = val.additionalInfo
    const updatedAddInfo = [...beforeAddInfo]
    updatedAddInfo.push({ key: 'jobDescription', value: textAreaValue })

    const result = await dispatch(
      registerThunk({ ...val, additionalInfo: updatedAddInfo, type: 'Parents' })
    )

    if (result.payload.status === 200) {
      fireToastMessage({
        success: true,
        message: 'Your account was created successfully'
      })
      navigate('/login')
      window.location.reload()
    } else {
      fireToastMessage({ type: 'error', message: result.payload.message })
    }
  }
  const handleChange = e => {
    setTextAreaValue(e.target.value)
  }

  // Update the description state when the user types
  const step4Data = [
    {
      name: 'Your home'
    },
    {
      name: "Other family's home"
    },
    {
      name: 'Rotating between homes'
    },
    {
      name: 'Neutral location'
    }
  ]
  const step5Data = [
    {
      name: 'Montessori Attachment parenting RIE'
    },
    {
      name: 'Authoritative Permissive'
    },
    {
      name: 'Strict'
    },
    {
      name: 'Flexible'
    }
  ]

  const step6Data = [
    {
      name: '$20-$25 per hour',
      val: '20to25'
    },
    {
      name: '$25-$30 per hour',
      val: '25to30'
    },
    {
      name: '$30-$35 per hour',
      val: '30to35'
    },
    {
      name: '$35-$40 per hour',
      val: '35to40'
    },
    {
      name: '$40-$45 per hour',
      val: '40to45'
    }
  ]

  const step7Data = [
    {
      name: 'No pets'
    },
    {
      name: 'Dog(s)'
    },
    {
      name: 'Cat(s)'
    },
    {
      name: 'Small animals'
    },
    {
      name: 'Birds'
    }
  ]

  const step8Data = [
    {
      name: 'Non-smoker'
    },
    {
      name: 'CPR certified'
    },
    {
      name: 'Multilingual'
    },
    {
      name: 'Experience with special needs'
    },
    {
      name: "Valid driver's license"
    },
    {
      name: 'Owns a car'
    },
    {
      name: 'Comfortable with pets'
    }
  ]

  const step9Data = [
    {
      name: 'Regular meetings'
    },
    {
      name: 'Group chat'
    },
    {
      name: 'Shared calendar'
    },
    {
      name: 'Email updates'
    },
    {
      name: 'Phone calls'
    },
    {
      name: 'Owns a car'
    },
    {
      name: 'Comfortable with pets'
    }
  ]

  const step10Data = [
    {
      name: 'Family members'
    },
    {
      name: 'Backup nanny service'
    },
    {
      name: 'Friends or neighbors'
    },
    {
      name: 'Local daycare'
    },
    {
      name: 'No backup options'
    }
  ]

  const step11Data = [
    {
      name: 'Very involved'
    },
    {
      name: 'Moderately involved'
    },
    {
      name: 'Minimal involvement'
    }
  ]

  const step12Data = [
    {
      name: 'Nap times'
    },
    {
      name: 'Outdoor play'
    },
    {
      name: 'Educational activities'
    },
    {
      name: 'Structured meal times'
    },
    {
      name: 'Storytime'
    },
    {
      name: 'Arts and crafts'
    }
  ]

  const step13Data = [
    {
      name: 'Screen time limits'
    },
    {
      name: 'Dietary restrictions'
    },
    {
      name: 'Behavior expectations'
    },
    {
      name: 'Hygiene practices'
    },
    {
      name: 'Chore responsibilities'
    }
  ]

  const step14Data = [
    {
      name: 'Food allergies'
    },
    {
      name: 'Environmental allergies'
    },
    {
      name: 'Asthma Medication needs'
    }
  ]

  const step15Data = [
    {
      name: 'Very flexible'
    },
    {
      name: 'Somewhat flexible'
    },
    {
      name: 'Not flexible'
    }
  ]
  const step16Data = [
    {
      name: 'Yes'
    },
    {
      name: 'No'
    }
  ]
  const step17Data = [
    {
      name: 'Full-time'
    },
    {
      name: 'Part-time'
    },
    {
      name: 'Occasional'
    },
    {
      name: 'Flexible'
    }
  ]
  const step18Data = [
    {
      heading: 'Language Skills',
      input: 'Specify Language',
      subHeading: 'Non-English speaking is acceptable',
      data: [{ name: 'English' }, { name: 'Bilingual' }]
    },
    {
      heading: 'Certifications',
      data: [
        { name: 'CPR/First Aid Certified' },
        { name: 'Early Childhood Education' },
        { name: 'Special Needs Training' }
      ]
    },

    {
      heading: 'Driving Ability',
      data: [
        { name: "Must have a valid driver's license" },
        { name: 'Owns a car' },
        { name: "Using caregiver's car" },
        { name: "Using family's car" }
      ]
    },
    {
      heading: 'Availability',
      data: [{ name: 'Weekdays' }, { name: 'Weekends' }, { name: 'Evenings' }]
    },
    {
      heading: 'Other Skills',
      data: [
        { name: 'Pet care' },
        { name: 'Homework assistance' },
        { name: 'Swimming supervision' }
      ]
    }
  ]

  const step19Data = [
    {
      heading: 'House Management/Cleaning',
      data: [
        { name: 'Child-related only' },
        { name: 'Child-related and general household tasks' }
      ]
    },
    {
      heading: 'Cooking',
      data: [
        { name: 'For children only' },
        { name: 'For children and parents' }
      ]
    },
    {
      heading: 'Errands and Grocery Shopping',
      data: [
        { name: 'Child-related only' },
        { name: 'Child-related and household tasks' }
      ]
    },
    {
      heading: 'Transportation',
      data: [
        { name: 'Transporting children only' },
        { name: 'Transporting children and running household errands' }
      ]
    },
    {
      heading: 'Experience Level',
      data: [{ name: '1-2 years' }, { name: '3-5 years' }, { name: '5+ years' }]
    },
    {
      heading: 'Educational Activities',
      data: [
        {
          name: 'Planning and supervising educational activities for children'
        },
        { name: 'Tutoring or homework assistance' }
      ]
    }
  ]
  const stepCheckData = [
    {
      name: 'Childcare Light housekeeping'
    },
    {
      name: 'Meal preparation'
    },
    {
      name: 'Transportation'
    },
    {
      name: 'Educational activities'
    },
    {
      name: 'Outdoor play Errands'
    },
    {
      name: 'Grocery shopping'
    }
  ]
  const data1 = [
    {
      name: 'Private Educator',
      subHead: 'Personalized academic support.'
    },
    {
      name: 'Specialized Caregiver',
      subHead: 'Doula, night nurse, special needs care.'
    },
    {
      name: 'Sports Coaches',
      subHead: 'Coaches for soccer, basketball, tennis, and more.'
    },
    {
      name: 'Music Instructor',
      subHead: 'Lessons for various musical instruments.'
    },
    {
      name: 'Swim Instructor',
      subHead: 'Swimming lessons and water safety.'
    },
    {
      name: 'House Manager',
      subHead: 'Help with maintaining an organized home.'
    }
  ]
  const handleBack = () => {
    if (step == 1) {
      navigate(-1)
    }
    if (step > 1) {
      // Move to the previous step
      setStep(prevStep => prevStep - 1)
    }
  }

  const [nannyShare, setNannyShare] = useState('yes') // Manage radio button selection

  const onRadioChange1 = newVal => {
    setNannyShare(newVal) // Set radio value when changed
  }

  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ]

  // Initialize the state in the parent component
  const [daysState, setDaysState] = useState(
    daysOfWeek.reduce((acc, day) => {
      acc[day] = { checked: false, start: null, end: null }
      return acc
    }, {})
  )

  // This function will update the state when passed down to HireStep3
  const updateDaysState = updatedDaysState => {
    setDaysState(updatedDaysState)
  }

  const handleNext = async () => {
    if (step === 1 && hireStep1FormRef.current) {
      hireStep1FormRef.current
        .validateFields()
        .then(async values => {
          // If form is valid, submit it and move to the next step
          const dob = `${values.month} ${values.date} ${values.year}`
          if (!values.location) {
            fireToastMessage({
              type: 'error',
              message: 'Please fill location fields'
            })
          }

          
          // if (!values.remember) {
          //   fireToastMessage({
          //     type: "error",
          //     message: "Please check Terms & Condition",
          //   });
          //   setLoading(false);
          //   return;
          // }
          else {
            const { data, status } = await api.get(
              `/location?address=${values.location}`
            )
            if (status == 200) {
              const cor = data?.results[0]?.geometry.location
              const location1 = {
                type: 'Point',
                coordinates: [cor.lng, cor.lat],
                format_location: data?.results[0]?.formatted_address
              }
              dispatch(
                updateForm({
                  name: values.name,
                  email: values.email,
                  password: values.password,
                  zipCode: values.zipCode,
                  dob: dob,
                  location: location1
                })
              )

              setStep(prevStep => prevStep + 1)
            }
          }
        })
        .catch(errorInfo => {
          // Handle validation failure
          if (errorInfo.errorFields[0].name == 'remember') {
            fireToastMessage({
              type: 'error',
             message: "Please check Terms & Condition",
            })
          }
        }) // Submit the form in step 2
      // setStep(prevStep => prevStep + 1);
    } else if (step == 2) {
      setStep(prevStep => prevStep + 1)
    } else if (step === 3 && hireStep2FormRef.current) {
      nannyShare == 'no'
        ? hireStep2FormRef.current
          .validateFields()
          .then(values => {
            const hasAtLeastOneTrue = Object.values(values).some(
              value => value === true
            )
            if (hasAtLeastOneTrue) {
              // If form is valid, submit it and move to the next step
              dispatch(setAddSer(values))
              setStep(prevStep => prevStep + 1) // Move to the next step
            } else {
              // Show an error message if no option is selected
              fireToastMessage({
                type: 'error',
                message: 'Select at least one option'
              })
            }
            // Move to the next step
          })
          .catch(errorInfo => {
            // Handle validation failure
                  fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
          })
        : selectedValue
          ? hireStep2FormRef.current
            .validateFields()
            .then(values => {
              dispatch(
                addOrUpdateAdditionalInfo({
                  key: 'noOfChildren',
                  value: values
                })
              )
              setStep(prevStep => prevStep + 1) // Move to the next step
            })
            .catch(errorInfo => {
              // Handle validation failure
                    fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
            })
          : fireToastMessage({ type: 'error', message: 'Select number of child' })
      // setStep(prevStep => prevStep + 1);
    } else if (step == 4) {
      // Get an array of all the selected days (those where checked === true)
      if (nannyShare == 'no') {
        selectedValue
          ? hireStep2FormRef.current
            .validateFields()
            .then(values => {

              dispatch(
                addOrUpdateAdditionalInfo({
                  key: 'noOfChildren',
                  value: values
                })
              )
              setStep(prevStep => prevStep + 1) // Move to the next step
            })
            .catch(errorInfo => {
              // Handle validation failure
                    fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
            })
          : fireToastMessage({
            type: 'error',
            message: 'Select number of child'
          })
      } else {
        const selectedDays = Object.entries(daysState).filter(
          ([day, { checked }]) => checked
        )

        if (selectedDays.length === 0) {
          fireToastMessage({
            type: 'error',
            message: 'At least one day must be selected.'
          })
          return
        }

        let allValid = true // Flag to check if all selected days have valid start and end times
        let invalidDays = []

        // Loop through selected days to ensure each has a valid start and end time
        selectedDays.forEach(([day, { start, end }]) => {
          if (!start || !end) {
            allValid = false
            invalidDays.push(day) // Collect days with missing start or end times
          } else if (start.isSame(end)) {
            allValid = false
            invalidDays.push(day) // Collect days where start and end are the same
          } else if (end.isBefore(start)) {
            // Error if end time is before start time
            allValid = false
            invalidDays.push(day) // Collect days where end is before start
          }
        })

        if (!allValid) {
          fireToastMessage({
            type: 'error',
            message: `The following selected days have invalid start or end times: ${invalidDays.join(
              ', '
            )}`
          })
          return
        }

        // Additional checks for overlapping times (uncomment if needed)
        // if (selectedDays.length >= 2) {
        //     let overlapping = false;

        //     // Compare each selected day's start and end times
        //     for (let i = 0; i < selectedDays.length; i++) {
        //         const [day1, { start: start1, end: end1 }] = selectedDays[i];

        //         for (let j = i + 1; j < selectedDays.length; j++) {
        //             const [day2, { start: start2, end: end2 }] = selectedDays[j];

        //             // Ensure no overlapping times
        //             if (
        //                 (start1.isBefore(end2) && end1.isAfter(start2)) || // Check overlap between two days
        //                 (start1.isSame(end2) || start2.isSame(end1))
        //             ) {
        //                 // (`Error: Time overlap between ${day1} and ${day2}`);
        //                 overlapping = true;
        //                 break;
        //             }
        //         }
        //         if (overlapping) break;
        //     }

        //     if (overlapping) {
        //         return;
        //     }
        // }

        // If all checks pass, proceed with submission
        const checkedDays = Object.entries(daysState)
          .filter(([day, data]) => data.checked) // Keep only those with checked: true
          .reduce((acc, [day, data]) => {
            // Convert start and end times to string (ISO format or any preferred format)
            const start = data.start.toISOString() // Assuming start is a date object
            const end = data.end.toISOString() // Assuming end is a date object

            acc[day] = {
              ...data,
              start, // Replace the start time with a string
              end // Replace the end time with a string
            }
            return acc
          }, {})
        dispatch(
          addOrUpdateAdditionalInfo({
            key: 'specificDaysAndTime',
            value: checkedDays
          })
        )
        setStep(prevStep => prevStep + 1)
      }
    } else if (step === 5 && hireStep4FormRef.current) {
      if (nannyShare == 'no') {
        hireStep4FormRef.current
          .validateFields()
          .then(values => {
            // Check if the preferredLocation (or whatever your field is) has been set
            if (values.option) {

              dispatch(
                addOrUpdateAdditionalInfo({
                  key: 'childrenSpecialNeeds',
                  value: values
                })
              )
              setStep(prevStep => prevStep + 1) // Move to the next step
            } else {
              // Show an error message if no option is selected
              fireToastMessage({
                type: 'error',
                message: 'Select at least one option'
              })
            }
          })
          .catch(errorInfo => {
            // Handle validation failure
                  fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
          })
      } else {
        hireStep4FormRef.current
          .validateFields()
          .then(values => {
            // Check if the preferredLocation (or whatever your field is) has been set
            if (values.option) {
              dispatch(
                addOrUpdateAdditionalInfo({ key: 'takePlace', value: values })
              )
              setStep(prevStep => prevStep + 1) // Move to the next step
            } else {
              // Show an error message if no option is selected
              fireToastMessage({
                type: 'error',
                message: 'Select at least one option'
              })
            }
          })
          .catch(errorInfo => {
            // Handle validation failure
                  fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
          })
      }
      // setStep(prevStep => prevStep + 1);
    } else if (step === 6 && hireStep4FormRef.current) {
      if (nannyShare == 'no') {
        hireStep4FormRef.current
          .validateFields()
          .then(values => {
            // Check if the preferredLocation (or whatever your field is) has been set
            if (values.option) {
              dispatch(
                addOrUpdateAdditionalInfo({
                  key: 'preferredSchedule',
                  value: values
                })
              )
              setStep(prevStep => prevStep + 1) // Move to the next step
            } else {
              // Show an error message if no option is selected
              fireToastMessage({
                type: 'error',
                message: 'Select at least one option'
              })
            }
          })
          .catch(errorInfo => {
            // Handle validation failure
                  fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
          })
      } else {
        hireStep4FormRef.current
          .validateFields()
          .then(values => {
            // Check if the preferredLocation (or whatever your field is) has been set
            if (values.option) {
              dispatch(
                addOrUpdateAdditionalInfo({
                  key: 'specificStyle',
                  value: values
                })
              )
              setStep(prevStep => prevStep + 1) // Move to the next step
            } else {
              // Show an error message if no option is selected
              fireToastMessage({
                type: 'error',
                message: 'Select at least one option'
              })
            }
          })
          .catch(errorInfo => {
            // Handle validation failure
                  fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
          })
      }
      //setStep(prevStep => prevStep + 1);
    } else if (step === 7 && hireStep4FormRef.current) {
      if (nannyShare == 'yes') {
        hireStep4FormRef.current
          .validateFields()
          .then(values => {
            // Check if the preferredLocation (or whatever your field is) has been set
            if (values.option.length > 0) {
              dispatch(
                addOrUpdateAdditionalInfo({ key: 'resToHandle', value: values })
              )
              hireStep4FormRef.current.resetFields()
              setStep(prevStep => prevStep + 1) // Move to the next step
            } else {
              // Show an error message if no option is selected
              fireToastMessage({
                type: 'error',
                message: 'Check at least one option'
              })
            }
          })
          .catch(errorInfo => {
            // Handle validation failure
                  fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
          })
      } else {
        const selectedDays = Object.entries(daysState).filter(
          ([day, { checked }]) => checked
        )

        if (selectedDays.length === 0) {
          fireToastMessage({
            type: 'error',
            message: 'At least one day must be selected.'
          })
          return
        }

        let allValid = true // Flag to check if all selected days have valid start and end times
        let invalidDays = []

        // Loop through selected days to ensure each has a valid start and end time
        selectedDays.forEach(([day, { start, end }]) => {
          if (!start || !end) {
            allValid = false
            invalidDays.push(day) // Collect days with missing start or end times
          } else if (start.isSame(end)) {
            allValid = false
            invalidDays.push(day) // Collect days where start and end are the same
          } else if (end.isBefore(start)) {
            // Error if end time is before start time
            allValid = false
            invalidDays.push(day) // Collect days where end is before start
          }
        })

        if (!allValid) {
          fireToastMessage({
            type: 'error',
            message: `The following selected days have invalid start or end times: ${invalidDays.join(
              ', '
            )}`
          })
          return
        }

        // Additional checks for overlapping times (uncomment if needed)
        // if (selectedDays.length >= 2) {
        //     let overlapping = false;

        //     // Compare each selected day's start and end times
        //     for (let i = 0; i < selectedDays.length; i++) {
        //         const [day1, { start: start1, end: end1 }] = selectedDays[i];

        //         for (let j = i + 1; j < selectedDays.length; j++) {
        //             const [day2, { start: start2, end: end2 }] = selectedDays[j];

        //             // Ensure no overlapping times
        //             if (
        //                 (start1.isBefore(end2) && end1.isAfter(start2)) || // Check overlap between two days
        //                 (start1.isSame(end2) || start2.isSame(end1))
        //             ) {
        //                 // (`Error: Time overlap between ${day1} and ${day2}`);
        //                 overlapping = true;
        //                 break;
        //             }
        //         }
        //         if (overlapping) break;
        //     }

        //     if (overlapping) {
        //         return;
        //     }
        // }

        // If all checks pass, proceed with submission
        const checkedDays = Object.entries(daysState)
          .filter(([day, data]) => data.checked) // Keep only those with checked: true
          .reduce((acc, [day, data]) => {
            // Convert start and end times to string (ISO format or any preferred format)
            const start = data.start.toISOString() // Assuming start is a date object
            const end = data.end.toISOString() // Assuming end is a date object

            acc[day] = {
              ...data,
              start, // Replace the start time with a string
              end // Replace the end time with a string
            }
            return acc
          }, {})
        dispatch(
          addOrUpdateAdditionalInfo({
            key: 'specificDaysAndTime',
            value: checkedDays
          })
        )
        setStep(prevStep => prevStep + 1)
      }
    } else if (step === 8 && hireStep4FormRef.current) {
      if (nannyShare == 'no') {
        hireStep4FormRef.current
          .validateFields()
          .then(values => {

            // Get the keys of the form values to dynamically check all arrays
            const requiredFields = Object.keys(values)

            // Check if all required arrays have at least one value
            const hasErrors = requiredFields.some(field => {
              const fieldValue = values[field]
              return Array.isArray(fieldValue) && fieldValue.length === 0 // Only check if the field is an array and is empty
            })

            if (hasErrors) {
              // Show an error message if any of the arrays are empty
              fireToastMessage({
                type: 'error',
                message: 'Each field must have at least one value.'
              })
            } else {
              // Proceed if validation passes
              dispatch(
                addOrUpdateAdditionalInfo({
                  key: 'specificReqForCaregiver',
                  value: values
                })
              )
              // Perform any next step here, like moving to the next step
              setStep(prevStep => prevStep + 1) // Move to the next step
            }
          })
          .catch(error => {
            console.error('Form submission error:', error)
            fireToastMessage({
              type: 'error',
              message: 'Form submission failed. Please try again.'
            })
          })
      } else {
        hireStep4FormRef.current
          .validateFields()
          .then(values => {
            // Check if the preferredLocation (or whatever your field is) has been set
            if (values.option) {
              dispatch(
                addOrUpdateAdditionalInfo({ key: 'totalBudget', value: values })
              )
              hireStep4FormRef.current.resetFields()
              setStep(prevStep => prevStep + 1) // Move to the next step
            } else {
              // Show an error message if no option is selected
              fireToastMessage({
                type: 'error',
                message: 'Select at least one option'
              })
            }
          })
          .catch(errorInfo => {
            // Handle validation failure
                  fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
          })
      }
    } else if (step === 9 && hireStep4FormRef.current) {
      if (nannyShare == 'no') {
        hireStep4FormRef.current
          .validateFields()
          .then(values => {
            // Dynamically extract required fields from formData
            const requiredFields = step19Data.map(field =>
              toCamelCase(field.heading)
            )

            let allRequiredFieldsValid = true

            requiredFields.forEach(field => {
              if (
                values[field] === null ||
                values[field] === undefined ||
                values[field].length === 0
              ) {
                allRequiredFieldsValid = false
              }
            })

            if (!allRequiredFieldsValid) {
              fireToastMessage({
                type: 'error',
                message: 'Please fill out all required fields.'
              })
              return // Exit if required fields are invalid
            }

            // Optional fields can be ignored if they're undefined, but if they exist, ensure they're not null
            Object.keys(values).forEach(key => {
              if (values[key] === undefined) {
                // Optional field, so we can ignore if undefined
                delete values[key] // Optionally remove it if you don't want it in the final submission
              }
            })

            dispatch(
              addOrUpdateAdditionalInfo({
                key: 'expectationFromCaregiver',
                value: values
              })
            )
            // If all required fields are valid, proceed to the next step
            setStep(prevStep => prevStep + 1)
          })
          .catch(errorInfo => {
            // Handle validation failure
                  fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
          })
      } else {
        hireStep4FormRef.current
          .validateFields()
          .then(values => {
            // Check if the preferredLocation (or whatever your field is) has been set
            if (values.option) {
              dispatch(
                addOrUpdateAdditionalInfo({ key: 'havePets', value: values })
              )
              hireStep4FormRef.current.resetFields()
              setStep(prevStep => prevStep + 1) // Move to the next step
            } else {
              // Show an error message if no option is selected
              fireToastMessage({
                type: 'error',
                message: 'Select at least one option'
              })
            }
          })
          .catch(errorInfo => {
            // Handle validation failure
                  fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
          })
      }
    } else if (step === 10 && hireStep4FormRef.current) {
      if (nannyShare == 'no') {
        hireStep4FormRef.current
          .validateFields()
          .then(values => {
            dispatch(setAddSer(values))
            const trueRoles = Object.entries(innerObject)
              .filter(([key, value]) => value === true) // Keep only those with value: true
              .reduce((acc, [key]) => {
                acc[key] = true // Rebuild the object with true values
                return acc
              }, {})
            const keysArray = Object.keys(trueRoles).filter(
              key => trueRoles[key]
            )
            if (keysArray.length > 1) {
              dispatch(
                addOrUpdateAdditionalInfo({
                  key: 'additionalServices',
                  value: keysArray
                })
              )
            }
            setStep(prevStep => prevStep + 1)
          })
          .catch(errorInfo => {
            // Handle validation failure
                  fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
          })
      } else {
        hireStep4FormRef.current
          .validateFields()
          .then(values => {
            // Check if the preferredLocation (or whatever your field is) has been set
            if (values.option) {
              dispatch(
                addOrUpdateAdditionalInfo({ key: 'specificReq', value: values })
              )
              hireStep4FormRef.current.resetFields()
              setStep(prevStep => prevStep + 1) // Move to the next step
            } else {
              // Show an error message if no option is selected
              fireToastMessage({
                type: 'error',
                message: 'Select at least one option'
              })
            }
          })
          .catch(errorInfo => {
            // Handle validation failure
                  fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
          })
      }

      // setStep(prevStep => prevStep + 1);
    } else if (step === 11 && hireStep4FormRef.current) {
      if (nannyShare == 'no') {
        if (textAreaValue.length > 0) {
          if (trueCount > 1) {
            await dispatch(
              addOrUpdateAdditionalInfo({
                key: 'jobDescription',
                value: textAreaValue
              })
            )
            setStep(prevStep => prevStep + 1)
          } else {
            Register()
          }
        } else {
          fireToastMessage({
            type: 'error',
            message: 'Please write the job description'
          })
        }
      } else {
        hireStep4FormRef.current
          .validateFields()
          .then(values => {
            // Check if the preferredLocation (or whatever your field is) has been set
            if (values.option) {
              dispatch(
                addOrUpdateAdditionalInfo({ key: 'commAndCor', value: values })
              )
              hireStep4FormRef.current.resetFields()
              setStep(prevStep => prevStep + 1) // Move to the next step
            } else {
              // Show an error message if no option is selected
              fireToastMessage({
                type: 'error',
                message: 'Select at least one option'
              })
            }
          })
          .catch(errorInfo => {
                  fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
          })
      }
    } else if (step === 12 && hireStep4FormRef.current) {
      hireStep4FormRef.current
        .validateFields()
        .then(values => {
          // Check if the preferredLocation (or whatever your field is) has been set
          if (values.option) {
            dispatch(
              addOrUpdateAdditionalInfo({ key: 'backupCare', value: values })
            )
            hireStep4FormRef.current.resetFields()
            setStep(prevStep => prevStep + 1) // Move to the next step
          } else {
            // Show an error message if no option is selected
            fireToastMessage({
              type: 'error',
              message: 'Select at least one option'
            })
          }
        })
        .catch(errorInfo => {
          // Handle validation failure
                fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
        })
    } else if (step === 13 && hireStep4FormRef.current) {
      hireStep4FormRef.current
        .validateFields()
        .then(values => {
          // Check if the preferredLocation (or whatever your field is) has been set
          if (values.option) {
            dispatch(
              addOrUpdateAdditionalInfo({ key: 'dailyAct', value: values })
            )
            hireStep4FormRef.current.resetFields()
            setStep(prevStep => prevStep + 1) // Move to the next step
          } else {
            // Show an error message if no option is selected
            fireToastMessage({
              type: 'error',
              message: 'Select at least one option'
            })
          }
        })
        .catch(errorInfo => {
          // Handle validation failure
                fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
        })
    } else if (step === 14 && hireStep4FormRef.current) {
      hireStep4FormRef.current
        .validateFields()
        .then(values => {
          // Check if the preferredLocation (or whatever your field is) has been set
          if (values.option) {
            dispatch(
              addOrUpdateAdditionalInfo({ key: 'specificAct', value: values })
            )
            hireStep4FormRef.current.resetFields()
            setStep(prevStep => prevStep + 1) // Move to the next step
          } else {
            // Show an error message if no option is selected
            fireToastMessage({
              type: 'error',
              message: 'Select at least one option'
            })
          }
        })
        .catch(errorInfo => {
          // Handle validation failure
                fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
        })
    } else if (step === 15 && hireStep4FormRef.current) {
      hireStep4FormRef.current
        .validateFields()
        .then(values => {
          // Check if the preferredLocation (or whatever your field is) has been set
          if (values.option) {
            dispatch(
              addOrUpdateAdditionalInfo({ key: 'specificGuide', value: values })
            )
            hireStep4FormRef.current.resetFields()
            setStep(prevStep => prevStep + 1) // Move to the next step
          } else {
            // Show an error message if no option is selected
            fireToastMessage({
              type: 'error',
              message: 'Select at least one option'
            })
          }
        })
        .catch(errorInfo => {
          // Handle validation failure
                fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
        })
    } else if (step === 16 && hireStep4FormRef.current) {
      hireStep4FormRef.current
        .validateFields()
        .then(values => {
          // Check if the preferredLocation (or whatever your field is) has been set
          if (values.option) {
            dispatch(
              addOrUpdateAdditionalInfo({ key: 'healthCon', value: values })
            )
            hireStep4FormRef.current.resetFields()
            setStep(prevStep => prevStep + 1) // Move to the next step
          } else {
            // Show an error message if no option is selected
            fireToastMessage({
              type: 'error',
              message: 'Select at least one option'
            })
          }
        })
        .catch(errorInfo => {
          // Handle validation failure
                fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
        })
    } else if (step === 17 && hireStep4FormRef.current) {
      hireStep4FormRef.current
        .validateFields()
        .then(async values => {
          // Check if the preferredLocation (or whatever your field is) has been set
          if (values.option) {
            // If form is valid, submit it and move to the next step

            dispatch(
              addOrUpdateAdditionalInfo({ key: 'flexSch', value: values })
            )

            hireStep4FormRef.current.resetFields()
            setStep(prevStep => prevStep + 1)
          } else {
            // Show an error message if no option is selected
            fireToastMessage({
              type: 'error',
              message: 'Select at least one option'
            })
          }
        })
        .catch(errorInfo => {
                fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
        })
    } else if (step === 18 && hireStep4FormRef.current) {
      hireStep2FormRef.current
        .validateFields()
        .then(values => {
          const hasAtLeastOneTrue = Object.values(values).some(
            value => value === true
          )
          if (hasAtLeastOneTrue) {
            // If form is valid, submit it and move to the next step
            dispatch(setAddSer(values))
            setStep(prevStep => prevStep + 1) // Move to the next step
          } else {
            // Show an error message if no option is selected
            fireToastMessage({
              type: 'error',
              message: 'Select at least one option'
            })
          }
          // Move to the next step
        })
        .catch(errorInfo => {
          // Handle validation failure
                fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
        })
    } else if (step === 19 && hireStep4FormRef.current) {
      hireStep4FormRef.current
        .validateFields()
        .then(values => {
          // Check if the preferredLocation (or whatever your field is) has been set
          if (values.option) {
            // If form is valid, submit it and move to the next step


            dispatch(
              addOrUpdateAdditionalInfo({
                key: 'childrenSpecialNeeds',
                value: values
              })
            )
            setStep(prevStep => prevStep + 1); // Move to the next step
          } else {
            // Show an error message if no option is selected
            fireToastMessage({
              type: 'error',
              message: 'Select at least one option'
            })
          }
        })
        .catch(errorInfo => {
          // Handle validation failure
                fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
        })
    } else if (step === 20 && hireStep4FormRef.current) {
      hireStep4FormRef.current
        .validateFields()
        .then(values => {
          // Check if the preferredLocation (or whatever your field is) has been set
          if (values.option) {
            // If form is valid, submit it and move to the next step

            dispatch(
              addOrUpdateAdditionalInfo({
                key: 'preferredSchedule',
                value: values
              })
            )
            setStep(prevStep => prevStep + 1) // Move to the next step
          } else {
            // Show an error message if no option is selected
            fireToastMessage({
              type: 'error',
              message: 'Select at least one option'
            })
          }
        })
        .catch(errorInfo => {
          // Handle validation failure
                fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
        })
    } else if (step === 21 && hireStep4FormRef.current) {
      const selectedDays = Object.entries(daysState).filter(
        ([day, { checked }]) => checked
      )

      if (selectedDays.length === 0) {
        fireToastMessage({
          type: 'error',
          message: 'At least one day must be selected.'
        })
        return
      }

      let allValid = true // Flag to check if all selected days have valid start and end times
      let invalidDays = []

      // Loop through selected days to ensure each has a valid start and end time
      selectedDays.forEach(([day, { start, end }]) => {
        if (!start || !end) {
          allValid = false
          invalidDays.push(day) // Collect days with missing start or end times
        } else if (start.isSame(end)) {
          allValid = false
          invalidDays.push(day) // Collect days where start and end are the same
        } else if (end.isBefore(start)) {
          // Error if end time is before start time
          allValid = false
          invalidDays.push(day) // Collect days where end is before start
        }
      })

      if (!allValid) {
        fireToastMessage({
          type: 'error',
          message: `The following selected days have invalid start or end times: ${invalidDays.join(
            ', '
          )}`
        })
        return
      }

      // Additional checks for overlapping times (uncomment if needed)
      // if (selectedDays.length >= 2) {
      //     let overlapping = false;

      //     // Compare each selected day's start and end times
      //     for (let i = 0; i < selectedDays.length; i++) {
      //         const [day1, { start: start1, end: end1 }] = selectedDays[i];

      //         for (let j = i + 1; j < selectedDays.length; j++) {
      //             const [day2, { start: start2, end: end2 }] = selectedDays[j];

      //             // Ensure no overlapping times
      //             if (
      //                 (start1.isBefore(end2) && end1.isAfter(start2)) || // Check overlap between two days
      //                 (start1.isSame(end2) || start2.isSame(end1))
      //             ) {
      //                 // (`Error: Time overlap between ${day1} and ${day2}`);
      //                 overlapping = true;
      //                 break;
      //             }
      //         }
      //         if (overlapping) break;
      //     }

      //     if (overlapping) {
      //         return;
      //     }
      // }

      // If all checks pass, proceed with submission
      const checkedDays = Object.entries(daysState)
        .filter(([day, data]) => data.checked) // Keep only those with checked: true
        .reduce((acc, [day, data]) => {
          // Convert start and end times to string (ISO format or any preferred format)
          const start = data.start.toISOString() // Assuming start is a date object
          const end = data.end.toISOString() // Assuming end is a date object

          acc[day] = {
            ...data,
            start, // Replace the start time with a string
            end // Replace the end time with a string
          }
          return acc
        }, {})
      dispatch(
        addOrUpdateAdditionalInfo({
          key: 'specificDaysAndTime',
          value: checkedDays
        })
      )
      setStep(prevStep => prevStep + 1)
    } else if (step === 22 && hireStep4FormRef.current) {
      hireStep4FormRef.current
        .validateFields()
        .then(values => {


          // Get the keys of the form values to dynamically check all arrays
          const requiredFields = Object.keys(values)

          // Check if all required arrays have at least one value
          const hasErrors = requiredFields.some(field => {
            const fieldValue = values[field]
            return Array.isArray(fieldValue) && fieldValue.length === 0 // Only check if the field is an array and is empty
          })

          if (hasErrors) {
            // Show an error message if any of the arrays are empty
            fireToastMessage({
              type: 'error',
              message: 'Each field must have at least one value.'
            })
          } else {
            // Proceed if validation passes
            dispatch(
              addOrUpdateAdditionalInfo({
                key: 'specificReqForCaregiver',
                value: values
              })
            )
            // Perform any next step here, like moving to the next step
            setStep(prevStep => prevStep + 1) // Move to the next step
          }
        })
        .catch(error => {
          console.error('Form submission error:', error)
          fireToastMessage({
            type: 'error',
            message: 'Form submission failed. Please try again.'
          })
        })
    } else if (step === 23 && hireStep4FormRef.current) {
      hireStep4FormRef.current
        .validateFields()
        .then(values => {
          // Dynamically extract required fields from formData
          const requiredFields = step19Data.map(field =>
            toCamelCase(field.heading)
          )

          let allRequiredFieldsValid = true

          requiredFields.forEach(field => {
            if (
              values[field] === null ||
              values[field] === undefined ||
              values[field].length === 0
            ) {
              allRequiredFieldsValid = false
            }
          })

          if (!allRequiredFieldsValid) {
            fireToastMessage({
              type: 'error',
              message: 'Please fill out all required fields.'
            })
            return // Exit if required fields are invalid
          }

          // Optional fields can be ignored if they're undefined, but if they exist, ensure they're not null
          Object.keys(values).forEach(key => {
            if (values[key] === undefined) {
              // Optional field, so we can ignore if undefined
              delete values[key] // Optionally remove it if you don't want it in the final submission
            }
          })

          dispatch(
            addOrUpdateAdditionalInfo({
              key: 'expectationFromCaregiver',
              value: values
            })
          )
          // If all required fields are valid, proceed to the next step
          setStep(prevStep => prevStep + 1)
        })
        .catch(errorInfo => {
          // Handle validation failure
                fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
        })
    } else if (step === 24 && hireStep4FormRef.current) {
      hireStep4FormRef.current
        .validateFields()
        .then(values => {
          dispatch(setAddSer(values))
          // Log correct form values
          const trueRoles = Object.entries(innerObject)
            .filter(([key, value]) => value === true) // Keep only those with value: true
            .reduce((acc, [key]) => {
              acc[key] = true // Rebuild the object with true values
              return acc
            }, {})
          const keysArray = Object.keys(trueRoles).filter(key => trueRoles[key])
          if (keysArray.length > 1) {
            dispatch(
              addOrUpdateAdditionalInfo({
                key: 'additionalServices',
                value: keysArray
              })
            )
          }
          setStep(prevStep => prevStep + 1)
        })
        .catch(errorInfo => {
          // Handle validation failure
                fireToastMessage({
            type: "error",
            message:
              errorInfo?.errorFields?.[0]?.errors?.[0] || "Validation failed",
          });
        })
    } else if (step === 25 && hireStep4FormRef.current) {
      if (textAreaValue.length > 0) {
        if (trueCount > 1) {
          await dispatch(
            addOrUpdateAdditionalInfo({
              key: 'jobDescription',
              value: textAreaValue
            })
          )
          setStep(prevStep => prevStep + 1)
        } else {
          await Register()
        }
      } else {
        fireToastMessage({
          type: 'error',
          message: 'Please write the job description'
        })
      }
    }
  }
  // Render different content based on the current step
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <HireStep1 formRef={hireStep1FormRef} head={'Welcome Parents'} type="Parents" handleNext={() => setStep((prev) => prev + 1)}/>
          </>
          // Pass form reference to HireStep1
        )
      case 2:
        return (
          <div className='step-content'>
            <p className='px-3 width-form font-normal text-center uppercase Livvic offer-font'>
              Are you looking for a nanny share ?
            </p>
            <div className='flex justify-center my-10'>
              <div>
                <div className='flex'>
                  <InputRadio
                    name='Yes'
                    val={'yes'}
                    value={nannyShare}
                    onRadioChange={onRadioChange1}
                  />
                  <img
                    style={{ marginTop: '-28px' }}
                    className='ml-4 object-contain'
                    src={quesMark}
                    alt='quesMark'
                  />
                </div>

                <br />
                <InputRadio
                  name='No'
                  val={'no'}
                  value={nannyShare}
                  onRadioChange={onRadioChange1}
                />
              </div>
            </div>
          </div>
        )
      case 3:
        return (
          <div>
            {nannyShare == 'yes' ? (
              <HireStep2
                opt={Array.from({ length: 12 }, (_, i) => i + 1)}
                formRef={hireStep2FormRef}
                selectedValue={selectedValue}
                handleSelectChange={handleSelectChange}
              />
            ) : (
              <NannyNoStep2
                formRef={hireStep2FormRef}
                data={data1}
                defaultValue={'Nanny'}
                defaultSubValue={'Full-time, part-time, or live-in care.'}
              />
            )}
          </div>
        )
      case 4:
        return (
          <div>
            {nannyShare == 'yes' ? (
              <HireStep3
                daysState={daysState}
                setDaysState={updateDaysState}
                head={'What is your desired schedule for nanny care?'}
              />
            ) : (
              <HireStep2
                opt={Array.from({ length: 12 }, (_, i) => i + 1)}
                formRef={hireStep2FormRef}
                selectedValue={selectedValue}
                handleSelectChange={handleSelectChange}
              />
            )}
          </div>
        )
      case 5:
        return (
          <div>
            {nannyShare == 'yes' ? (
              <HireStep4
                formRef={hireStep4FormRef}
                head={'Where would you prefer the nanny share to take place?'}
                data={step4Data}
              />
            ) : (
              <HireStep4
                formRef={hireStep4FormRef}
                head={'Do any of your children have special needs?'}
                data={step16Data}
                defaultVal={'yes'}
                inputName={'Additional Text'}
              />
            )}
          </div>
        )
      case 6:
        return (
          <div>
            {nannyShare == 'yes' ? (
              <HireStep4
                formRef={hireStep4FormRef}
                head={'Do you have a specific parenting style or philosophy?'}
                data={step5Data}
              />
            ) : (
              <HireStep4
                formRef={hireStep4FormRef}
                head={'What is your preferred schedule for childcare?'}
                data={step17Data}
                inputNot={true}
              />
            )}
          </div>
        )
      case 7:
        return (
          <div>
            {nannyShare == 'yes' ? (
              <HireStep4
                formRef={hireStep4FormRef}
                head={
                  'What responsibilities would you like the nanny to handle?'
                }
                data={stepCheckData}
                checkBox={true}
              />
            ) : (
              <HireStep3
                daysState={daysState}
                setDaysState={updateDaysState}
                head={
                  'Do you have specific days and times when you need childcare?'
                }
              />
            )}
          </div>
        )
      case 8:
        return (
          <div>
            {nannyShare == 'yes' ? (
              <HireStep4
                formRef={hireStep4FormRef}
                head={
                  "What is your total budget range for the nanny's hourly rate, to be shared equally between families?"
                }
                data={step6Data}
                subHead={
                  'This is the total budget, you will only pay half of this if shared with another family'
                }
              />
            ) : (
              <MultiFormContainerCheck
                head={
                  'Do you have any specific requirements or preferences for your caregiver?'
                }
                formData={step18Data}
                formRef={hireStep4FormRef}
              />
            )}
          </div>
        )
      case 9:
        return (
          <div>
            {nannyShare == 'yes' ? (
              <HireStep4
                formRef={hireStep4FormRef}
                head={'Do you have pets? If so, what kind?'}
                data={step7Data}
              />
            ) : (
              <MultiFormContainer
                head={'What are your expectations from the caregiver?'}
                formData={step19Data}
                formRef={hireStep4FormRef}
                addInput={{
                  name: 'Other',
                  placeholder: 'Type here...'
                }}
              />
            )}
          </div>
        )
      case 10:
        return (
          <div>
            {nannyShare == 'yes' ? (
              <HireStep4
                formRef={hireStep4FormRef}
                head={'Do you have any specific requirements for the nanny?'}
                data={step8Data}
              />
            ) : (
              <AddSer formRef={hireStep4FormRef} />
            )}
          </div>
        )
      case 11:
        return (
          <div>
            {nannyShare == 'yes' ? (
              <HireStep4
                formRef={hireStep4FormRef}
                head={
                  'How do you prefer to communicate and coordinate with another family?'
                }
                data={step9Data}
              />
            ) : (
              <div>
                <p className='px-3 width-form font-normal text-center Livvic offer-font'>
                  Write job description
                </p>
                <Form
                  className='flex justify-center'
                  form={form}
                  name='validateOnly'
                  autoComplete='off'
                >
                  <div>
                    <p className='mt-10 mb-1 text-xl Livvic'>
                      Job Description
                    </p>
                    <Form.Item
                      name='jobDescription'
                      rules={[
                        {
                          required: true,
                          message: ''
                        }
                      ]}
                    >
                      <Input.TextArea
                        defaultValue={textAreaValue}
                        value={textAreaValue} // Controlled value
                        onChange={handleChange} // Handle input changes
                        placeholder={
                          !isDisabled ? 'Write job description..' : ''
                        }
                        rows={6}
                        className='py-4 border-none rounded-3xl input-width no-resize'
                        disabled={isDisabled} // Disable input if isDisabled is true
                      />
                    </Form.Item>
                  </div>
                </Form>
              </div>
            )}
          </div>
        )
      case 12:
        return (
          <div>
            {nannyShare == 'yes' ? (
              <HireStep4
                formRef={hireStep4FormRef}
                head={
                  'Do you have any backup care options in case the nanny is unavailable?'
                }
                data={step10Data}
              />
            ) : (
              <>
                {(() => {
                  if (v.value.privateEducator) {
                    return navigate('/tutor')
                  } else if (v.value.specializedCaregiver) {
                    return navigate('/specialCaregiver')
                  } else if (v.value.sportsCoaches) {
                    return navigate('/sportCoach')
                  } else if (v.value.musicInstructor) {
                    return navigate('/music')
                  } else if (v.value.swimInstructor) {
                    return navigate('/swim')
                  } else if (v.value.houseManager) {
                    return navigate('/houseManager')
                  }
                  return null // If none of the conditions are true, return null or some default component
                })()}
              </>
            )}
          </div>
        )
      case 13:
        return (
          <div>
            {nannyShare == 'yes' && (
              <HireStep4
                formRef={hireStep4FormRef}
                head={
                  'How involved do you want to be in daily activities and decision-making?'
                }
                data={step11Data}
              />
            )}
          </div>
        )
      case 14:
        return (
          <div>
            {nannyShare == 'yes' && (
              <HireStep4
                formRef={hireStep4FormRef}
                head={
                  'What is your daily routine and any specific activities you want to include?'
                }
                data={step12Data}
              />
            )}
          </div>
        )
      case 15:
        return (
          <div>
            {nannyShare == 'yes' && (
              <HireStep4
                formRef={hireStep4FormRef}
                head={'Do you have specific house rules or guidelines?'}
                data={step13Data}
              />
            )}
          </div>
        )
      case 16:
        return (
          <div>
            {nannyShare == 'yes' && (
              <HireStep4
                formRef={hireStep4FormRef}
                head={
                  'Are there any allergies or health considerations the nanny should be aware of?'
                }
                data={step14Data}
              />
            )}
          </div>
        )
      case 17:
        return (
          <div>
            {nannyShare == 'yes' && (
              <HireStep4
                formRef={hireStep4FormRef}
                head={'How flexible are you with scheduling and arrangements?'}
                data={step15Data}
              />
            )}
          </div>
        )
      case 18:
        return (
          <div>
            {nannyShare == 'yes' && (
              <NannyNoStep2
                formRef={hireStep2FormRef}
                data={data1}
                defaultValue={'Nanny'}
                defaultSubValue={'Full-time, part-time, or live-in care.'}
              />
            )}
          </div>
        )
      case 19:
        return (
          <div>
            {nannyShare == 'yes' && (
              <HireStep4
                formRef={hireStep4FormRef}
                head={'Do any of your children have special needs?'}
                data={step16Data}
                defaultVal={'yes'}
                inputName={'Additional Text'}
              />
            )}
          </div>
        )
      case 20:
        return (
          <div>
            {nannyShare == 'yes' && (
              <HireStep4
                formRef={hireStep4FormRef}
                head={'What is your preferred schedule for childcare?'}
                data={step17Data}
                inputNot={true}
              />
            )}
          </div>
        )
      case 21:
        return (
          <div>
            {nannyShare == 'yes' && (
              <HireStep3
                daysState={daysState}
                setDaysState={updateDaysState}
                head={
                  'Do you have specific days and times when you need childcare?'
                }
              />
            )}
          </div>
        )
      case 22:
        return (
          <div>
            {nannyShare == 'yes' && (
              <MultiFormContainerCheck
                head={
                  'Do you have any specific requirements or preferences for your caregiver?'
                }
                formData={step18Data}
                formRef={hireStep4FormRef}
              />
            )}
          </div>
        )
      case 23:
        return (
          <div>
            {nannyShare == 'yes' && (
              <MultiFormContainer
                head={'What are your expectations from the caregiver?'}
                formData={step19Data}
                formRef={hireStep4FormRef}
                addInput={{
                  name: 'Other',
                  placeholder: 'Type here...'
                }}
              />
            )}
          </div>
        )
      case 24:
        return (
          <div>
            {nannyShare == 'yes' && <AddSer formRef={hireStep4FormRef} />}
          </div>
        )
      case 25:
        return (
          <div>
            {nannyShare == 'yes' && (
              <div>
                <p className='px-3 width-form font-normal text-center Livvic offer-font'>
                  Write job description
                </p>
                <Form
                  className='flex justify-center'
                  form={form}
                  name='validateOnly'
                  autoComplete='off'
                >
                  <div>
                    <p className='mt-10 mb-1 text-xl Livvic'>
                      Job Description
                    </p>
                    <Form.Item
                      name='jobDescription'
                      rules={[
                        {
                          required: true,
                          message: ''
                        }
                      ]}
                    >
                      <Input.TextArea
                        defaultValue={textAreaValue}
                        value={textAreaValue} // Controlled value
                        onChange={handleChange} // Handle input changes
                        placeholder={
                          !isDisabled ? 'Write job description..' : ''
                        }
                        rows={6}
                        className='py-4 border-none rounded-3xl input-width no-resize'
                        disabled={isDisabled} // Disable input if isDisabled is true
                      />
                    </Form.Item>
                  </div>
                </Form>
              </div>
            )}
          </div>
        )
      case 26:
        return (
          <div>
            {nannyShare == 'yes' && (
              <>
                {(() => {
                  if (v.value.privateEducator) {
                    return navigate('/tutor')
                  } else if (v.value.specializedCaregiver) {
                    return navigate('/specialCaregiver')
                  } else if (v.value.sportsCoaches) {
                    return navigate('/sportCoach')
                  } else if (v.value.musicInstructor) {
                    return navigate('/music')
                  } else if (v.value.swimInstructor) {
                    return navigate('/swim')
                  } else if (v.value.houseManager) {
                    return navigate('/houseManager')
                  }
                  return null // If none of the conditions are true, return null or some default component
                })()}
              </>
            )}
          </div>
        )
      default:
        return <p>Unknown step</p>
    }
  }
  return (
    <div className='padd-res'>
      <div
        className='px-4 py-4'
      >
        <div className='flex justify-end'>
          <button onClick={handleGoBack}>
            <CloseOutlined style={{ fontSize: '24px' }} />
          </button>
        </div>
        <div className='flex justify-center'>
          <div>
            {renderStepContent()} {/* Render content based on step */}
            <div className='my-5 text-center'>
              {step === 11 && nannyShare === 'no' ? (
                // <button
                //   style={{ border: '1px solid #38AEE3' }}
                //   className='bg-white mx-6 my-0 mt-2 px-10 py-2 rounded-full font-normal margin-2'
                //   onClick={toggleButton} // Toggles between enabling and disabling the button
                // >
                //   Write by Myself
                // </button>
                <Button btnText={"Write By Myself"} action={() => toggleButton()}/>
              ) : (
                nannyShare == 'no' &&
                step < 12 && (
                  // <button
                  //   style={{ border: '1px solid #38AEE3' }}
                  //   className='bg-white mx-6 my-0 mt-2 px-10 py-2 rounded-full font-normal text-base'
                  //   onClick={handleBack}
                  // >
                  //   Back
                  // </button>
                   <Button btnText={"Back"} action={() => handleBack()}/>
                )
              )}
              {nannyShare == 'yes' && (
                // <button
                //   style={{ border: '1px solid #38AEE3' }}
                //   className='bg-white mx-6 my-0 mt-2 px-10 py-2 rounded-full font-normal text-base'
                //   onClick={handleBack}
                // >
                //   Back
                // </button>
                 <Button btnText={"Back"} action={() => handleBack()}/>
              )}

              {nannyShare == 'no' && step > 0 && step <= 11 && (
                // <button
                //   style={{ background: '#85D1F1' }}
                //   className='mx-auto my-0 px-6 py-2 rounded-full font-normal text-base transition hover:-translate-y-1 duration-700 delay-150 ease-in-out hover:scale-110'
                //   onClick={handleNext}
                // >
                //   Continue
                // </button>
                   <Button btnText={"Continue"} action={() => handleNext()} className="bg-blue-300"/>
              )}
              {nannyShare == 'yes' && (
                // <button
                //   style={{ background: '#85D1F1' }}
                //   className='mx-auto my-0 px-6 py-2 rounded-full font-normal text-base transition hover:-translate-y-1 duration-700 delay-150 ease-in-out hover:scale-110'
                //   onClick={handleNext}
                // >
                //   Continue
                // </button>
                 <Button btnText={"Continue"} action={() => handleNext()} className="bg-blue-300"/>
              )}

              {step == 0 && (
                <p className='mt-2 mb-10 font-normal text-base cursor-pointer already-acc'>
                  Already have an account?{' '}
                  <NavLink to='/login' onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                    <span className='hover:text-blue-600 underline transition-colors duration-300'>Log in</span>
                  </NavLink>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
