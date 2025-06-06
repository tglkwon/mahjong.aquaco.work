import React from 'react';

function MessageDisplay({ message, isVisible }) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm p-3 sm:p-4 bg-green-100 text-green-700 rounded-md shadow-lg text-center text-xs sm:text-sm md:text-base z-[60]">
      {message}
    </div>
  );
}

export default MessageDisplay;