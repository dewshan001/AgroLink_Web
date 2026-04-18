import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './pendingExpertVerification.css';
import { useToast } from './Toast';

export default function PendingExpertVerification() {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('approve'); // 'approve' or 'reject'
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);
  const { toast, ToastContainer } = useToast();

  useEffect(() => {
    fetchPendingExperts();
  }, []);

  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && showFullscreen) {
        setShowFullscreen(false);
      }
    };

    if (showFullscreen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
        document.body.style.overflow = 'unset';
      };
    }
  }, [showFullscreen]);

  const fetchPendingExperts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/expert-images/admin/pending');
      setExperts(res.data || []);
    } catch (err) {
      console.error('Failed to fetch pending experts:', err);
      toast.error('Failed to load pending experts');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (expert) => {
    setSelectedExpert(expert);
    setModalMode('approve');
    setNotes('');
    setShowModal(true);
  };

  const handleRejectClick = (expert) => {
    setSelectedExpert(expert);
    setModalMode('reject');
    setNotes('');
    setShowModal(true);
  };

  const handleSubmitDecision = async () => {
    if (!selectedExpert) return;

    if (modalMode === 'reject' && !notes.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'approve') {
        await axios.put(`/users/admin/approve/${selectedExpert._id}`, {
          verificationNotes: notes
        });
        toast.success(`Expert ${selectedExpert.name} has been approved!`);
      } else {
        await axios.put(`/users/admin/reject/${selectedExpert._id}`, {
          verificationNotes: notes || 'Farm images did not meet verification requirements'
        });
        toast.success(`Expert ${selectedExpert.name} has been rejected`);
      }
      
      // Clear modal and refresh list
      setShowModal(false);
      setSelectedExpert(null);
      setNotes('');
      fetchPendingExperts();
    } catch (err) {
      console.error('Failed to process expert:', err);
      toast.error(`Failed to ${modalMode} expert`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to count images
  const getImageCount = () => {
    if (selectedExpert && selectedExpert.farmImages) {
      return selectedExpert.farmImages.filter(img => img.image).length;
    }
    return 0;
  };

  const openFullscreenImage = (imageData, index) => {
    setFullscreenImage(imageData);
    setFullscreenImageIndex(index);
    setShowFullscreen(true);
  };

  const goToPreviousImage = () => {
    if (!selectedExpert?.farmImages) return;
    const newIndex = fullscreenImageIndex === 0 ? selectedExpert.farmImages.length - 1 : fullscreenImageIndex - 1;
    setFullscreenImageIndex(newIndex);
    setFullscreenImage(selectedExpert.farmImages[newIndex]);
  };

  const goToNextImage = () => {
    if (!selectedExpert?.farmImages) return;
    const newIndex = (fullscreenImageIndex + 1) % selectedExpert.farmImages.length;
    setFullscreenImageIndex(newIndex);
    setFullscreenImage(selectedExpert.farmImages[newIndex]);
  };

  if (loading) {
    return (
      <div className="expertVerificationContainer">
        <div className="expertVerificationLoader">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading pending experts...</p>
        </div>
      </div>
    );
  }

  if (experts.length === 0) {
    return (
      <div className="expertVerificationContainer">
        <div className="expertVerificationHeader">
          <h2>
            <i className="fas fa-user-check"></i>
            Expert Verification
          </h2>
        </div>
        <div className="expertVerificationEmpty">
          <i className="fas fa-check-circle"></i>
          <h3>No Pending Verification</h3>
          <p>All expert accounts have been verified!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="expertVerificationContainer">
      <div className="expertVerificationHeader">
        <h2>
          <i className="fas fa-user-check"></i>
          Expert Verification
        </h2>
        <span className="expertVerificationBadge">{experts.length} Pending</span>
      </div>

      <div className="expertVerificationList">
        {experts.map((expert) => (
          <div key={expert._id} className="expertVerificationCard">
            <div className="expertVerificationCardHeader">
              <div className="expertVerificationCardInfo">
                <h3>{expert.name}</h3>
                <p className="expertEmail">{expert.email}</p>
                <p className="expertPhone">{expert.phone}</p>
              </div>
              <div className="expertVerificationCardStatus">
                <span className="expertStatusBadge pending">
                  <i className="fas fa-hourglass-half"></i>
                  Pending
                </span>
              </div>
            </div>

            <div className="expertVerificationCardDescription">
              <p className="expertDescription">{expert.description}</p>
            </div>

            {/* Farm Images Gallery */}
            <div className="expertVerificationImageSection">
              <label className="expertImageLabel">
                <i className="fas fa-images"></i>
                Farm Images ({expert.farmImages?.length || 0})
              </label>
              {expert.farmImages && expert.farmImages.length > 0 ? (
                <div className="expertImageGallery">
                  {expert.farmImages.map((img, idx) => (
                    <div 
                      key={idx} 
                      className="expertImagePreview"
                      onClick={() => {
                        setSelectedExpert(expert);
                        openFullscreenImage(img, idx);
                      }}
                    >
                      <img 
                        src={img.image} 
                        alt={`Farm ${idx + 1}`}
                        className="expertImageThumbnail"
                      />
                      <span className="expertImageIndex">{idx + 1}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="expertNoImages">
                  <i className="fas fa-image"></i>
                  <p>No farm images uploaded</p>
                </div>
              )}
            </div>

            {/* Verification Notes (if any) */}
            {expert.verificationNotes && (
              <div className="expertVerificationNotes">
                <label>Previous Feedback:</label>
                <p>{expert.verificationNotes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="expertVerificationActions">
              <button
                className="expertActionBtn approve"
                onClick={() => handleApproveClick(expert)}
                disabled={isSubmitting}
              >
                <i className="fas fa-check"></i>
                Approve
              </button>
              <button
                className="expertActionBtn reject"
                onClick={() => handleRejectClick(expert)}
                disabled={isSubmitting}
              >
                <i className="fas fa-times"></i>
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Image Viewer */}
      {showFullscreen && fullscreenImage && (
        <div className="expertFullscreenModal">
          <div 
            className="expertFullscreenOverlay" 
            onClick={() => setShowFullscreen(false)}
          />
          <div className="expertFullscreenContent">
            <button
              className="expertFullscreenClose"
              onClick={() => setShowFullscreen(false)}
              title="Close (ESC)"
            >
              <i className="fas fa-times"></i>
            </button>

            <div className="expertFullscreenImageWrapper">
              <img
                src={fullscreenImage.image}
                alt={`Farm ${fullscreenImageIndex + 1}`}
                className="expertFullscreenImage"
              />
            </div>

            <div className="expertFullscreenControls">
              <button
                className="expertFullscreenNavBtn"
                onClick={goToPreviousImage}
                title="Previous (←)"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <div className="expertFullscreenInfo">
                <span>Image {fullscreenImageIndex + 1} of {selectedExpert?.farmImages?.length || 0}</span>
              </div>
              <button
                className="expertFullscreenNavBtn"
                onClick={goToNextImage}
                title="Next (→)"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="expertVerificationModal">
          <div className="expertVerificationModalOverlay" onClick={() => setShowModal(false)} />
          <div className="expertVerificationModalContent">
            <div className="expertVerificationModalHeader">
              <h3>
                {modalMode === 'approve' ? (
                  <>
                    <i className="fas fa-check-circle"></i>
                    Approve Expert
                  </>
                ) : (
                  <>
                    <i className="fas fa-times-circle"></i>
                    Reject Expert
                  </>
                )}
              </h3>
              <button
                className="expertModalClose"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="expertVerificationModalBody">
              <div className="expertVerificationModalInfo">
                <p><strong>Expert:</strong> {selectedExpert?.name}</p>
                <p><strong>Email:</strong> {selectedExpert?.email}</p>
                {selectedExpert?.farmImages && (
                  <p><strong>Farm Images:</strong> {selectedExpert.farmImages.length} images</p>
                )}
              </div>

              {/* Images Preview */}
              {selectedExpert?.farmImages && selectedExpert.farmImages.length > 0 && (
                <div className="expertModalImagePreview">
                  <label>Farm Images:</label>
                  <div className="expertModalImageGallery">
                    {selectedExpert.farmImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="expertModalImageItemWrapper"
                        onClick={() => {
                          openFullscreenImage(img, idx);
                        }}
                      >
                        <img
                          src={img.image}
                          alt={`Farm ${idx + 1}`}
                          className="expertModalImageItem"
                        />
                        <span className="expertModalImageZoom">
                          <i className="fas fa-expand"></i>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="expertVerificationModalForm">
                <label>
                  {modalMode === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason *'}
                </label>
                <textarea
                  className="expertVerificationFormTextarea"
                  placeholder={
                    modalMode === 'approve'
                      ? 'Add any notes about the verification...'
                      : 'Explain why the farm images are being rejected...'
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="expertVerificationModalFooter">
              <button
                className="expertVerificationFormBtn cancel"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
              >
                <i className="fas fa-times"></i>
                Cancel
              </button>
              <button
                className={`expertVerificationFormBtn ${modalMode}`}
                onClick={handleSubmitDecision}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className={`fas fa-${modalMode === 'approve' ? 'check' : 'times'}`}></i>
                    {modalMode === 'approve' ? 'Approve' : 'Reject'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
