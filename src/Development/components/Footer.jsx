import React, { useState } from 'react';
import { useEditContext } from '../context/EditModeContext.jsx';
import { useAppContext } from '../context/AppContext.jsx';
import { useInstitutionContext } from '../context/InstitutionContext.jsx';

const Footer = () => {

  const { institutionData, setInstitutionData } = useInstitutionContext();
  const { isEditMode } = useEditContext();

  // State for editable section titles
  const [quickLinksTitle, setQuickLinksTitle] = useState(institutionData.footer.quickLinks.title);
  const [getInTouchTitle, setGetInTouchTitle] = useState(institutionData.footer.getInTouch.title);
  const [usefulLinksTitle, setUsefulLinksTitle] = useState(institutionData.footer.usefulLinks.title);

  // State for editable links
  const [quickLinks, setQuickLinks] = useState(institutionData.footer.quickLinks.links);
  const [usefulLinks, setUsefulLinks] = useState(institutionData.footer.usefulLinks.links);

  // State for editable Get in Touch section
  const [getInTouchDescription, setGetInTouchDescription] = useState(institutionData.footer.getInTouch.description);
  const [emailPlaceholder, setEmailPlaceholder] = useState(institutionData.footer.getInTouch.emailPlaceholder);
  const [subscribeButtonText, setSubscribeButtonText] = useState(institutionData.footer.getInTouch.subscribeButtonText);

  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [selectedLinkIndex, setSelectedLinkIndex] = useState(null);
  const [selectedLinkType, setSelectedLinkType] = useState(null); // 'quick' or 'useful'
  const [tempLinkText, setTempLinkText] = useState('');
  const [tempLinkUrl, setTempLinkUrl] = useState('');

  // State for mock email subscribe (footer)
  const [footerEmail, setFooterEmail] = useState('');
  const [footerEmailStatus, setFooterEmailStatus] = useState({ loading: false, success: null, error: null });

  // Handle link changes
  const handleLinkChange = (setLinks, index, field, value) => {
    setLinks((prevLinks) => {
      const updatedLinks = [...prevLinks];
      updatedLinks[index] = { ...updatedLinks[index], [field]: value };
      return updatedLinks;
    });
  };

  // Open modal for link editing
  const openLinkModal = (link, index, type) => {
    setSelectedLink(link);
    setSelectedLinkIndex(index);
    setSelectedLinkType(type);
    setTempLinkText(link.text);
    setTempLinkUrl(link.url);
    setIsModalOpen(true);
  };

  // Save changes from modal
  const saveLinkChanges = () => {
    if (selectedLinkIndex !== null && selectedLinkType) {
      const setLinks = selectedLinkType === 'quick' ? setQuickLinks : setUsefulLinks;
      setLinks((prevLinks) => {
        const updatedLinks = [...prevLinks];
        updatedLinks[selectedLinkIndex] = { text: tempLinkText, url: tempLinkUrl };
        return updatedLinks;
      });
    }
    setIsModalOpen(false);
    setSelectedLink(null);
    setSelectedLinkIndex(null);
    setSelectedLinkType(null);
    setTempLinkText('');
    setTempLinkUrl('');
  };

  // Cancel changes
  const cancelLinkChanges = () => {
    setIsModalOpen(false);
    setSelectedLink(null);
    setSelectedLinkIndex(null);
    setSelectedLinkType(null);
    setTempLinkText('');
    setTempLinkUrl('');
  };

  // Add a new link
  const addLink = (setLinks) => {
    setLinks((prevLinks) => [
      ...prevLinks,
      { text: 'New Link', url: '#' }
    ]);
  };

  // Delete a link
  const deleteLink = (setLinks, index) => {
    setLinks((prevLinks) => prevLinks.filter((_, i) => i !== index));
  };

  // Modal component for editing links
  const LinkEditModal = () => (
    <div className="fixed inset-0 bg-opacity-50 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white border border-gray-300 rounded-xl p-6 w-full max-w-md shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold inter text-gray-800">Edit Link</h2>
          <button
            onClick={cancelLinkChanges}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 inter text-sm">Link Text</label>
            <input
              type="text"
              value={tempLinkText}
              onChange={(e) => setTempLinkText(e.target.value)}
              className="bg-gray-100 text-gray-800 border border-gray-300 rounded-lg px-3 py-2 w-full transition-colors inter"
              placeholder="Enter link text"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 inter text-sm">Link URL</label>
            <input
              type="text"
              value={tempLinkUrl}
              onChange={(e) => setTempLinkUrl(e.target.value)}
              className="bg-gray-100 text-gray-800 border border-gray-300 rounded-lg px-3 py-2 w-full transition-colors inter"
              placeholder="Enter URL"
            />
          </div>
          <div className="flex justify-end w-full gap-3 mt-4">
            <button
              onClick={cancelLinkChanges}
              className="bg-gray-100 hover:bg-gray-200 inter text-gray-700 px-4 py-2 rounded-lg transition duration-300"
            >
              Cancel
            </button>
            <button
              onClick={saveLinkChanges}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg inter transition duration-300"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Mock API for email subscribe in footer
  const handleFooterEmailSubmit = async (e) => {
    e.preventDefault();
    setFooterEmailStatus({ loading: true, success: null, error: null });
    await new Promise(res => setTimeout(res, 1000)); // Mock API delay
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(footerEmail)) {
      setFooterEmailStatus({ loading: false, success: "Subscribed successfully!", error: null });
      setFooterEmail('');
    } else {
      setFooterEmailStatus({ loading: false, success: null, error: "Please enter a valid email address." });
    }
  };

  return (
    <footer className="bg-black text-white py-10">
      <div className="container mx-auto px-6 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          {/* Quick Links Section */}
          <div className="w-full">
            {isEditMode ? (
              <div className="bg-gray-900 p-4 rounded-lg shadow-md">
                <input
                  type="text"
                  value={quickLinksTitle}
                  onChange={(e) => setQuickLinksTitle(e.target.value)}
                  className="text-2xl font-semibold mb-4 roboto text-white bg-gray-800 border border-gray-700 focus:border-orange-500 rounded-lg px-3 py-2 w-full transition-colors text-sm sm:text-base"
                />
                <ul className="space-y-3 text-gray-400">
                  {quickLinks.map((link, index) => (
                    <li key={index} className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={link.text}
                        onChange={(e) => handleLinkChange(setQuickLinks, index, 'text', e.target.value)}
                        className="bg-gray-800 text-white border border-gray-700 rounded-lg px-2 py-1 flex-1"
                      />
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => handleLinkChange(setQuickLinks, index, 'url', e.target.value)}
                        className="bg-gray-800 text-white border border-gray-700 rounded-lg px-2 py-1 flex-1"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => openLinkModal(link, index, 'quick')}
                          className=" text-orange-500 px-3 py-1 rounded-lg hover:text-orange-800 transition-colors text-sm roboto"
                          aria-label={`Edit Quick Link ${link.text}`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteLink(setQuickLinks, index)}
                          className=" text-red-500 px-3 py-1 rounded-lg hover:text-red-800 transition-colors text-sm roboto"
                          aria-label={`Delete Quick Link ${link.text}`}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => addLink(setQuickLinks)}
                  className="mt-4 bg-orange-200 text-orange-500 px-4 py-2 rounded-lg hover:bg-orange-300 transition-colors roboto text-sm sm:text-base"
                >
                  Add Link
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-semibold mb-4 roboto">{quickLinksTitle}</h3>
                <ul className="space-y-3 text-gray-400">
                  {quickLinks.map((link, index) => (
                    <li key={index}>
                      <a href={link.url} className="hover:text-white roboto transition-colors">
                        {link.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Get in Touch Section */}
          <div className="w-full">
            {isEditMode ? (
              <div className="bg-gray-900 p-4 rounded-lg shadow-md">
                <input
                  type="text"
                  value={getInTouchTitle}
                  onChange={(e) => setGetInTouchTitle(e.target.value)}
                  className="text-4xl mb-4 roboto text-white bg-gray-800 border border-gray-700 focus:border-orange-500 rounded-lg px-3 py-2 w-full transition-colors text-sm sm:text-base"
                />
                <textarea
                  value={getInTouchDescription}
                  onChange={(e) => setGetInTouchDescription(e.target.value)}
                  className="text-lg text-gray-400 mb-4 leading-relaxed roboto bg-gray-800 border border-gray-700 focus:border-orange-500 rounded-lg px-3 py-2 w-full transition-colors text-sm sm:text-base"
                  rows="3"
                />
                <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2">
                  <input
                    type="text"
                    value={emailPlaceholder}
                    onChange={(e) => setEmailPlaceholder(e.target.value)}
                    className="bg-gray-800 text-white px-5 py-3 rounded-lg w-full sm:max-w-xs border border-gray-700 focus:border-orange-500 transition-colors text-sm sm:text-base roboto"
                    placeholder="Email placeholder"
                  />
                  <input
                    type="text"
                    value={subscribeButtonText}
                    onChange={(e) => setSubscribeButtonText(e.target.value)}
                    className="bg-orange-500 text-white roboto px-6 py-3 rounded-lg border border-gray-700 hover:bg-orange-600 transition-colors w-full sm:w-auto text-sm sm:text-base"
                  />
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-4xl mb-4 roboto">{getInTouchTitle}</h3>
                <p className="text-lg text-gray-400 mb-4 leading-relaxed roboto">{getInTouchDescription}</p>
                <form
                  className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 roboto"
                  onSubmit={handleFooterEmailSubmit}
                >
                  <input
                    type="email"
                    value={footerEmail}
                    onChange={e => setFooterEmail(e.target.value)}
                    placeholder={emailPlaceholder}
                    disabled={footerEmailStatus.loading}
                    className="bg-gray-800 text-white px-5 py-3 rounded-lg w-full sm:max-w-xs outline-none placeholder-gray-400 border border-gray-700 focus:border-orange-500 transition-colors"
                  />
                  <button
                    type="submit"
                    className="bg-orange-500 text-white roboto px-6 py-3 rounded-lg hover:bg-orange-600 transition w-full sm:w-auto disabled:opacity-60"
                    disabled={footerEmailStatus.loading}
                  >
                    {footerEmailStatus.loading ? "Subscribing..." : subscribeButtonText}
                  </button>
                </form>
                {footerEmailStatus.success && (
                  <p className="text-green-400 mt-2">{footerEmailStatus.success}</p>
                )}
                {footerEmailStatus.error && (
                  <p className="text-red-400 mt-2">{footerEmailStatus.error}</p>
                )}
              </>
            )}
          </div>

          {/* Useful Links Section */}
          <div className="w-full md:text-right">
            {isEditMode ? (
              <div className="bg-gray-900 p-4 rounded-lg shadow-md">
                <input
                  type="text"
                  value={usefulLinksTitle}
                  onChange={(e) => setUsefulLinksTitle(e.target.value)}
                  className="text-2xl font-semibold mb-4 roboto text-white bg-gray-800 border border-gray-700 focus:border-orange-500 rounded-lg px-3 py-2 w-full transition-colors text-sm sm:text-base"
                />
                <ul className="space-y-3 text-gray-400">
                  {usefulLinks.map((link, index) => (
                    <li key={index} className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={link.text}
                        onChange={(e) => handleLinkChange(setUsefulLinks, index, 'text', e.target.value)}
                        className="bg-gray-800 text-white border border-gray-700 rounded-lg px-2 py-1 flex-1"
                      />
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => handleLinkChange(setUsefulLinks, index, 'url', e.target.value)}
                        className="bg-gray-800 text-white border border-gray-700 rounded-lg px-2 py-1 flex-1"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => openLinkModal(link, index, 'useful')}
                          className=" text-orange-500 px-3 py-1 rounded-lg hover:text-orange-800 transition-colors text-sm roboto"
                          aria-label={`Edit Useful Link ${link.text}`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteLink(setUsefulLinks, index)}
                          className=" text-red-500 px-3 py-1 rounded-lg hover:text-red-800 transition-colors text-sm roboto"
                          aria-label={`Delete Useful Link ${link.text}`}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => addLink(setUsefulLinks)}
                  className="mt-4 bg-orange-200 text-orange-500 px-4 py-2 rounded-lg hover:bg-orange-300 transition-colors roboto text-sm sm:text-base"
                >
                  Add Link
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-semibold mb-4 roboto">{usefulLinksTitle}</h3>
                <ul className="space-y-3 text-gray-400">
                  {usefulLinks.map((link, index) => (
                    <li key={index}>
                      <a href={link.url} className="hover:text-white roboto transition-colors">
                        {link.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
        <p className="mt-8 text-center">All rights reserved. © Hotel</p>
      </div>

      {/* Render Modal */}
      {isModalOpen && <LinkEditModal />}
    </footer>
  );
};

export default Footer;