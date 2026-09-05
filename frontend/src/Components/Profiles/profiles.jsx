import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import Ra from "../subComponents/rate";
import Prog from "../LoginAsFamily/subcomponents/progress";
import Reviews from "../LoginAsFamily/subcomponents/Reviews";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import Avatar from "react-avatar";
import axios from "axios";
import { customFormat, formatSentence } from "../subComponents/toCamelStr";
import Loader from "../subComponents/loader";
import { BACKEND_API_URL } from "../../Config/url";

export default function IndividualProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          setIsLoading(true); // Start loading
          const response = await axios.get(
            `${BACKEND_API_URL}userData/getById/${id}`
          );
          setData(response.data.message); // Assuming the response follows your backend structure
          setIsLoading(false); // Stop loading
        } catch (err) {
          console.error("Error fetching nanny data:", err);
          setError(err.message || "Something went wrong");
          setIsLoading(false); // Stop loading
        }
      }
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return <Loader />; // Customize loading message or spinner
  }

  if (error) {
    return <div>Error: {error}</div>; // Show error message
  }

  if (!data) {
    return <div>No data found for the selected user.</div>; // Handle no data case
  }

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return (
    <div className="padding-navbar1 Quicksand">
      {data.type == "Nanny" && (
        <>
          <div className="shadow-xl my-8 px-6 py-4 rounded-2xl text-center">
            <div className="flex justify-center">
              <div>
                {data?.imageUrl ? (
                  <img
                    className=" mx-auto rounded-full size-24 object-cover"
                    src={data?.imageUrl}
                    alt="img"
                  />
                ) : (
                  <Avatar
                    className="rounded-full text-black"
                    size="96"
                    color={"#AEC4FF"}
                    name={data?.name
                      ?.split(" ") // Split by space
                      .slice(0, 2) // Take first 1–2 words
                      .join(" ")}
                  />
                )}
                <p className="my-2 Livvic-Bold lg:text-3xl text-2xl">
                  {data?.name}
                </p>
                {/* <p className="Livvic-SemiBold text-lg">
                  Zip Code: {data?.zipCode}
                </p> */}
                {(data?.gender || data?.age) && (
                  <p className="mb-2 text-lg">
                    {data?.gender} {data?.age && `| Age: ${data?.age}`}
                  </p>
                )}

                {data?.additionalInfo[16]?.value.option && (
                  <p
                    style={{ background: "#E7F6FD" }}
                    className="mx-auto mt-4 px-2 py-1 rounded-lg w-20 text-sm"
                  >
                    {data?.additionalInfo[16]?.value.option}
                  </p>
                )}

                <div className="mt-2">
                  <Ra
                    points={data?.averageRating ? data?.averageRating : 0}
                    size={16}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="border-2 p-4 rounded-2xl">
            <p className="mb-2 Livvic-Bold text-2xl">Weekly Schedule</p>

            <div className="flex flex-wrap justify-left gap-x-10 gap-y-5">
              {days.map((day, index) => {
                const dayData = data?.additionalInfo[3]?.value[day];
                return (
                  <div
                    key={index}
                    className={`pr-8 ${
                      index < days.length - 1 ? "schdule-Border" : ""
                    }`}
                  >
                    <p className="Livvic-SemiBold text-lg">{day}</p>
                    {dayData && dayData.checked ? (
                      <>
                        <p>
                          Start{" "}
                          <span className="Livvic-Bold">
                            {new Date(dayData.start).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                        </p>
                        <p>
                          End{" "}
                          <span className="Livvic-Bold">
                            {new Date(dayData.end).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                        </p>
                      </>
                    ) : (
                      <p className="w-28">I don't work on {day}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-2 my-8 p-4 rounded-2xl">
            <p className="mb-2 Livvic-Bold text-2xl">Services</p>

            <div className="flex flex-wrap justify-between gap-x-10 gap-y-5">
              {data?.additionalInfo?.find((info) => info.key === "salaryExp")
                ?.value ? (
                Object.entries(
                  data.additionalInfo.find((info) => info.key === "salaryExp")
                    ?.value
                ).map(([key, value], i) => (
                  <div
                    key={i}
                    className="flex justify-between border-2 px-4 py-1 rounded-3xl w-72 text-gray-500 cursor-pointer"
                  >
                    <p className="text-lg">{i + 1} Child</p>
                    <p className="Livvic-Bold text-black text-lg">${value}/hr</p>
                  </div>
                ))
              ) : (
                <p>No salary data available</p> // Optional fallback if salaryExp is unavailable
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-6 w-full">
            <div className="border-2 p-4 rounded-2xl width-div">
              {" "}
              {/* 75% width */}
              <p className="mb-2 Livvic-Bold text-2xl">About Me</p>
              <p className="leading-5">
                {data?.aboutMe ? data?.aboutMe : "No description available."}
              </p>
            </div>
            <div className="border-2 p-4 rounded-2xl width-2div">
              {" "}
              {/* 25% width */}
              <p className="mb-2 Livvic-Bold text-2xl">Looking For</p>
              <div>
                <p className="text-base">
                  <span className="Livvic-SemiBold text-lg Quicksand">
                    Availability:
                  </span>{" "}
                  {
                    data?.additionalInfo.find(
                      (info) => info.key === "avaiForWorking"
                    )?.value?.option
                  }
                </p>

                <p className="text-base">
                  <span className="Livvic-SemiBold text-lg Quicksand">
                    Start:
                  </span>{" "}
                  {
                    data?.additionalInfo.find(
                      (info) => info.key === "availability"
                    )?.value?.option
                  }
                </p>

                <p className="text-base">
                  <span className="Livvic-SemiBold text-lg Quicksand">
                    Age group:
                  </span>{" "}
                  {data?.additionalInfo
                    .find((info) => info.key === "ageGroupsExp")
                    ?.value?.option.map((v, i) => (
                      <span key={i}>
                        {customFormat(v).split(" ")[0]}
                        {i <
                        data?.additionalInfo.find(
                          (info) => info.key === "ageGroupsExp"
                        )?.value?.option.length -
                          1
                          ? ", "
                          : ""}
                      </span>
                    ))}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-6 my-8 w-full">
            <div className="border-2 p-4 rounded-2xl width-div">
              {" "}
              {/* 75% width */}
              <p className="mb-2 Livvic-Bold text-2xl">Qualifications</p>
              <div>
                <p className="text-base">
                  <span className="Livvic-SemiBold text-lg Quicksand">
                    Certifications:{" "}
                  </span>
                  {data?.additionalInfo
                    .find((info) => info.key === "certification")
                    ?.value?.option.map((v, i) => (
                      <span key={i}>
                        {customFormat(v)}
                        {i <
                        data?.additionalInfo.find(
                          (info) => info.key === "certification"
                        )?.value?.option.length -
                          1
                          ? ", "
                          : ""}
                      </span>
                    ))}
                </p>
                <p className="text-base">
                  <span className="Livvic-SemiBold text-lg Quicksand">
                    Languages:{" "}
                  </span>
                  {data?.additionalInfo
                    .find((info) => info.key === "language")
                    ?.value?.option.map((v, i) => (
                      <span key={i}>
                        {customFormat(v)}
                        {i <
                        data?.additionalInfo.find(
                          (info) => info.key === "language"
                        )?.value?.option.length -
                          1
                          ? ", "
                          : ""}
                      </span>
                    ))}
                </p>
                <p className="text-base">
                  <span className="Livvic-SemiBold text-lg Quicksand">
                    Others:
                  </span>{" "}
                  {`${customFormat(
                    data?.additionalInfo?.find(
                      (info) => info.key === "ableToCook"
                    )?.value?.option || ""
                  )}, ${customFormat(
                    data?.additionalInfo?.find(
                      (info) => info.key === "helpWithHousekeeping"
                    )?.value?.option || ""
                  )}`}
                </p>
              </div>
            </div>
            <div className="border-2 p-4 rounded-2xl width-2div">
              <p className="mb-2 Livvic-Bold text-2xl">Work Experience</p>
              <div>
                <p className="Livvic-SemiBold text-lg Quicksand">
                  {
                    data?.additionalInfo.find(
                      (info) => info.key === "experience"
                    )?.value?.option
                  }{" "}
                  of experience caring for:
                </p>
                {data?.additionalInfo
                  .find((info) => info.key === "ageGroupsExp")
                  ?.value?.option.map((v, i) => (
                    <p className="text-base">
                      <span className="Livvic-SemiBold text-lg Quicksand">
                        {customFormat(v).split(" ")[0]}:
                      </span>{" "}
                      {customFormat(v).split(" ").slice(1).join(" ")}
                    </p>
                  ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-6 my-8 w-full">
            <div className="border-2 p-4 rounded-2xl width-div">
              <p className="mb-2 Livvic-Bold text-2xl">Reviews</p>
              {data?.reviews && data?.reviews?.length > 0 ? (
                <div>
                  <div className="flex gap-4">
                    <div>
                      {data?.averageRating && (
                        <p className="Livvic-Bold text-4xl text-center Quicksand">
                          {data?.averageRating}
                        </p>
                      )}

                      <Ra
                        points={data?.averageRating ? data?.averageRating : 0}
                        size={8}
                      />
                      <p style={{ fontSize: 8 }}>
                        {data?.reviews?.length} Reviews
                      </p>
                    </div>
                    <div>
                      <Prog num={5} pro={100} color={"#029E76"} />
                      <Prog num={4} pro={70} color={"#029E76"} />
                      <Prog num={3} pro={60} color={"#FEA500"} />
                      <Prog num={2} pro={40} color={"#FF5269"} />
                      <Prog num={1} pro={30} color={"#FF5269"} />
                    </div>
                  </div>

                  <div className="mt-10 pr-10 max-h-48 overflow-auto">
                    {data?.reviews.map((v, i) => (
                      <Reviews
                        size={8}
                        points={v?.rating}
                        para={v?.msg}
                        name={v?.userId?.name}
                        img={v?.userId?.imageUrl}
                        hr={i !== data?.reviews.length - 1} // Only add <hr> if it's not the last item
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <p>No reviews available</p>
              )}
            </div>

            <div className="border-2 p-4 rounded-2xl h-40 width-2div">
              <p className="mb-2 Livvic-Bold text-2xl">Verified Info</p>
              <div className="flex">
                <p className="w-52 Livvic-SemiBold text-lg Quicksand">
                  Phone Number
                </p>
                {data?.phoneNo ? <CheckOutlined /> : <CloseOutlined />}
              </div>

              <div className="flex">
                <p className="w-52 Livvic-SemiBold text-lg Quicksand">
                  National ID
                </p>
                {data?.verified?.nationalIDVer == "true" ? (
                  <CheckOutlined />
                ) : (
                  <CloseOutlined />
                )}
              </div>

              <div className="flex">
                <p className="w-52 Livvic-SemiBold text-lg Quicksand">Email</p>
                {data?.verified?.emailVer ? (
                  <CheckOutlined />
                ) : (
                  <CloseOutlined />
                )}
              </div>
            </div>
          </div>
        </>
      )}
      {data.type == "Parents" && (
        <>
          <div className="shadow-xl my-8 px-6 py-4 rounded-2xl text-center">
            <div className="flex justify-center">
              <div>
                {data?.imageUrl ? (
                  <img
                    className=" mx-auto rounded-full size-24 object-cover"
                    src={data?.imageUrl}
                    alt="img"
                  />
                ) : (
                  <Avatar
                    className="rounded-full text-black"
                    size="96"
                    color={"#AEC4FF"}
                    name={data?.name
                      ?.split(" ") // Split by space
                      .slice(0, 2) // Take first 1–2 words
                      .join(" ")}
                  />
                )}
                <p className="my-2 Livvic-Bold lg:text-3xl text-2xl">
                  {data?.name}
                </p>
                <p className="Livvic-SemiBold text-lg">
                  {data?.location?.format_location}
                </p>
                {/* <p className="Livvic-SemiBold text-lg">
                  Zip Code: {data?.zipCode}
                </p> */}
                {(data?.gender || data?.age) && (
                  <p className="mt-2 text-lg">
                    {data?.gender?.charAt(0).toUpperCase() +
                      data?.gender?.slice(1).toLowerCase()}{" "}
                    {data?.age && `| Age: ${data?.age}`}
                  </p>
                )}
                {data?.additionalInfo?.find(
                  (info) => info.key === "preferredSchedule"
                )?.value?.option && (
                  <p
                    style={{ background: "#E7F6FD" }}
                    className="mx-auto mt-4 px-2 py-1 rounded-lg w-20 text-sm"
                  >
                    {
                      data?.additionalInfo.find(
                        (info) => info.key === "preferredSchedule"
                      )?.value?.option
                    }
                  </p>
                )}
                <div className="mt-2">
                  <Ra
                    points={data?.averageRating ? data?.averageRating : 0}
                    size={16}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-6 w-full">
            <div className="border-2 p-4 rounded-2xl width-div">
              <p className="mb-2 Livvic-Bold text-2xl">Description</p>
              <p className="leading-5">
                {data?.type == "Parents"
                  ? data?.aboutMe
                    ? data?.aboutMe
                    : "No description available."
                  : data?.additionalInfo.find(
                      (info) => info.key === "jobDescription"
                    )?.value}
              </p>
            </div>
            <div className="width-2div">
              <div className="border-2 p-4 rounded-2xl">
                <p className="mb-2 Livvic-Bold text-2xl">Service</p>
                <div className="items-center">
                  {Array.isArray(data?.services) &&
                  data?.services.length > 0 ? (
                    data?.services.map((v, i) => (
                      <div key={i} className="flex items-start">
                        <p className="w-1/2 Livvic-SemiBold Quicksand">
                          {customFormat(v)}:
                        </p>
                        <span className="w-1/2 font-normal">Yes</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-start">
                      <p className="w-1/2 Livvic-SemiBold Quicksand">Nanny:</p>
                      <span className="w-1/2 font-normal">Yes</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-6 my-8 w-full">
            <div className="flex gap-6 border-2 p-4 rounded-2xl width-div">
              <div>
                <p className="mb-2 Livvic-Bold text-2xl">Number of Child</p>
                <p>{data?.noOfChildren?.length} Children</p>
              </div>
              <div>
                <p className="mb-2 Livvic-Bold text-2xl">Age of Children</p>
                <p>
                  {data?.noOfChildren?.info &&
                    Object.entries(data?.noOfChildren?.info)
                      .map(
                        ([child, age]) =>
                          `${formatSentence(child)}: ${age} years old`
                      )
                      .join(", ")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-6 my-8 w-full">
            <div className="border-2 p-4 rounded-2xl width-div">
              <p className="mb-2 Livvic-Bold text-2xl">Reviews</p>
              {data?.reviews && data?.reviews?.length > 0 ? (
                <div>
                  <div className="flex gap-4">
                    <div>
                      {data?.averageRating && (
                        <p className="Livvic-Bold text-4xl text-center Quicksand">
                          {data?.averageRating}
                        </p>
                      )}

                      <Ra
                        points={data?.averageRating ? data?.averageRating : 0}
                        size={8}
                      />
                      <p style={{ fontSize: 8 }}>
                        {data?.reviews?.length} Reviews
                      </p>
                    </div>
                    <div>
                      <Prog num={5} pro={100} color={"#029E76"} />
                      <Prog num={4} pro={70} color={"#029E76"} />
                      <Prog num={3} pro={60} color={"#FEA500"} />
                      <Prog num={2} pro={40} color={"#FF5269"} />
                      <Prog num={1} pro={30} color={"#FF5269"} />
                    </div>
                  </div>

                  <div className="mt-10 pr-10 max-h-48 overflow-auto">
                    {data?.reviews.map((v, i) => (
                      <Reviews
                        size={8}
                        points={v?.rating}
                        para={v?.msg}
                        name={v?.userId?.name}
                        img={v?.userId?.imageUrl}
                        hr={i !== data?.reviews.length - 1} // Only add <hr> if it's not the last item
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <p>No reviews available</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
