import React from "react";
import { Quote } from "lucide-react";
import { useEditContext } from "../../context/EditModeContext.jsx";
import ImageUploadModal from "../ui/ImageUploadModal.jsx";
import { useInstitutionContext } from "../../context/InstitutionContext.jsx";

export default function Testimonials() {
  const { institutionData, setInstitutionData } = useInstitutionContext();
  const { isEditMode } = useEditContext();

  const [isImageEdit, setIsImageEdit] = React.useState(false);
  const [imageMetaData, setImageMetaData] = React.useState(null);

  const TestimonialData = institutionData?.testimonials;

  const renderStars = (rating, index) => {
    const stars = Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={i < rating ? "text-yellow-400" : "text-gray-300"}
      >
        ★
      </span>
    ));
    return isEditMode ? (
      <select
        value={rating}
        onChange={(e) => {
          const newTestimonials = [...TestimonialData.testimonials];
          newTestimonials[index].rating = parseInt(e.target.value, 10);
          setInstitutionData((prev) => ({
            ...prev,
            testimonials: {
              ...prev.testimonials,
              testimonials: newTestimonials,
            },
          }));
        }}
        className="border border-gray-300 rounded px-2 py-1 text-sm cormorant"
      >
        {[1, 2, 3, 4, 5].map((num) => (
          <option key={num} value={num}>
            {num} Star{num > 1 ? "s" : ""}
          </option>
        ))}
      </select>
    ) : (
      <div className="flex justify-start mb-3 text-base">{stars}</div>
    );
  };

  return (
    <div className="bg-white py-20 px-8 sm:px-12 lg:px-16">
      {isImageEdit && imageMetaData && (
        <ImageUploadModal
          onClose={() => setIsImageEdit(false)}
          onUploadComplete={imageMetaData.onUploadComplete}
          folderName={imageMetaData.folderName}
          acceptedTypes={imageMetaData.acceptedTypes}
          title={imageMetaData.title}
        />
      )}
      <div className="max-w-7xl mx-auto">
        {/* Title Section */}
        {isEditMode ? (
          <div className="text-center">
            <div className="flex justify-center items-center gap-1 mb-2">
              <input
                type="text"
                value={TestimonialData?.title?.start || "Know"}
                onChange={(e) => {
                  setInstitutionData((prev) => ({
                    ...prev,
                    testimonials: {
                      ...prev.testimonials,
                      title: {
                        ...prev.testimonials.title,
                        start: e.target.value,
                      },
                    },
                  }));
                }}
                className="text-3xl fjalla text-black border border-gray-300 rounded px-1 py-0.5 text-center"
              />
              <input
                type="text"
                value={TestimonialData?.title?.highlight || "From"}
                onChange={(e) => {
                  setInstitutionData((prev) => ({
                    ...prev,
                    testimonials: {
                      ...prev.testimonials,
                      title: {
                        ...prev.testimonials.title,
                        highlight: e.target.value,
                      },
                    },
                  }));
                }}
                className="text-3xl fjalla text-orange-600 border border-gray-300 rounded px-1 py-0.5 text-center"
                style={{
                  width: `${TestimonialData?.title?.highlight.length + 3}ch`,
                }}
              />
              <input
                type="text"
                value={TestimonialData?.title?.end || "Our Customers"}
                onChange={(e) => {
                  setInstitutionData((prev) => ({
                    ...prev,
                    testimonials: {
                      ...prev.testimonials,
                      title: {
                        ...prev.testimonials.title,
                        end: e.target.value,
                      },
                    },
                  }));
                }}
                className="text-3xl fjalla text-black border border-gray-300 rounded px-1 py-0.5 text-center"
                style={{ width: `${TestimonialData?.title.end.length + 3}ch` }}
              />
            </div>
            <textarea
              value={TestimonialData?.introText || "Intro Text"}
              onChange={(e) => {
                setInstitutionData((prev) => ({
                  ...prev,
                  testimonials: {
                    ...prev.testimonials,
                    introText: e.target.value,
                  },
                }));
              }}
              className="text-black text-center mb-6 text-base cormorant border border-gray-300 rounded px-2 py-1 w-[62ch]"
              rows="1"
            />
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-5xl fjalla text-black mb-2">
              {TestimonialData?.title.start || "Know"}{" "}
              <span className="text-orange-600">
                {TestimonialData?.title.highlight || "From"}
              </span>{" "}
              {TestimonialData?.title.end || "Our Customers"}
            </h2>
            <p className="text-black text-center mb-6 text-base cormorant">
              {TestimonialData?.introText || "Intro Text"}
            </p>
          </div>
        )}

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {TestimonialData?.testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="rounded-2xl shadow-xl bg-white overflow-hidden relative flex flex-col border border-gray-200"
            >
              <div className="p-8 text-gray-800 relative flex-grow">
                <Quote className="text-gray-300 absolute top-4 right-4 w-10 h-10" />
                {renderStars(testimonial.rating || 1, index)}
                {isEditMode ? (
                  <textarea
                    value={testimonial.text || "Testimonial Text"}
                    onChange={(e) => {
                      const newTestimonials = [...TestimonialData.testimonials];
                      newTestimonials[index].text = e.target.value;
                      setInstitutionData((prev) => ({
                        ...prev,
                        testimonials: {
                          ...prev.testimonials,
                          testimonials: newTestimonials,
                        },
                      }));
                    }}
                    className="text-xl italic leading-relaxed font-semibold cormorant border border-gray-300 rounded px-2 py-1 w-full"
                  />
                ) : (
                  <p className="text-xl italic leading-relaxed font-semibold cormorant">
                    "{testimonial.text || "Testimonial Text"}"
                  </p>
                )}
              </div>

              {/* Profile Section */}
              <div className="bg-orange-600 py-5 flex items-center text-white px-8 rounded-b-2xl relative">
                {isEditMode ? (
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={testimonial.image || "https://placehold.co/50"}
                        alt={testimonial.name || "Testimonial"}
                        className="w-16 h-16 rounded-full border-2 border-white mr-4"
                      />
                      <button
                        onClick={() => {
                          setIsImageEdit(true);
                          setImageMetaData({
                            onUploadComplete: (url) => {
                              const newTestimonials = [
                                ...TestimonialData.testimonials,
                              ];
                              newTestimonials[index].image = url;
                              setInstitutionData((prev) => ({
                                ...prev,
                                testimonials: {
                                  ...prev.testimonials,
                                  testimonials: newTestimonials,
                                },
                              }));
                            },
                            folderName: "testimonialsSection",
                            acceptedTypes: ["image/jpeg", "image/png"],
                            title: `Edit Image ${index + 1}`,
                          });
                        }}
                        className="absolute top-2 right-2 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors z-10"
                        aria-label={`Edit Image ${index + 1}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={testimonial.name}
                        onChange={(e) => {
                          const newTestimonials = [
                            ...TestimonialData.testimonials,
                          ];
                          newTestimonials[index].name = e.target.value;
                          setInstitutionData((prev) => ({
                            ...prev,
                            testimonials: {
                              ...prev.testimonials,
                              testimonials: newTestimonials,
                            },
                          }));
                        }}
                        className="font-bold text-lg urbanist border border-gray-300 rounded px-2 py-1 text-black"
                      />
                      <input
                        type="text"
                        value={testimonial.title || "Testimonial Title"}
                        onChange={(e) => {
                          const newTestimonials = [
                            ...TestimonialData.testimonials,
                          ];
                          newTestimonials[index].title = e.target.value;
                          setInstitutionData((prev) => ({
                            ...prev,
                            testimonials: {
                              ...prev.testimonials,
                              testimonials: newTestimonials,
                            },
                          }));
                        }}
                        className="text-sm opacity-90 urbanist border border-gray-300 rounded px-2 py-1 text-black"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <img
                      src={testimonial.image || "https://placehold.co/50"}
                      alt={testimonial.name || "Testimonial"}
                      className="w-16 h-16 rounded-full border-2 border-white mr-4"
                    />
                    <div>
                      <p className="font-bold text-lg urbanist">
                        {testimonial.name || "Testimonial Name"}
                      </p>
                      <p className="text-sm opacity-90 urbanist">
                        {testimonial.title || "Testimonial Title"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
