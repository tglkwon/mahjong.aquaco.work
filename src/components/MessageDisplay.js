import React from 'react';

function MessageDisplay({ message, isVisible }) {
  if (!isVisible) return null;

  return (
    <div className="mt-4 p-2 bg-green-100 text-green-700 rounded-md shadow-sm text-sm sm:text-base">
      {message}
    </div>
  );
}

export default MessageDisplay;