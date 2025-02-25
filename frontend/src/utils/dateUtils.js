export const calculateNights = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  
  if (isNaN(start) || isNaN(end)) return 0;
  
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
export const formatDate = (dateString, format = 'medium') => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  if (isNaN(date)) return dateString;
  
  const options = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' },
    long: { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  };
  
  return date.toLocaleDateString('en-US', options[format] || options.medium);
};