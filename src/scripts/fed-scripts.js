// Handle stock row clicks
document.querySelectorAll('.stock-row').forEach(row => {
    row.addEventListener('click', function() {
        const detailsDiv = this.querySelector('.details');
        const allDetails = document.querySelectorAll('.details');
        
        // Close all other details
        allDetails.forEach(detail => {
            if (detail !== detailsDiv) {
                detail.classList.remove('active');
                detail.classList.add('hidden');
            }
        });
        
        // Toggle current details
        detailsDiv.classList.toggle('hidden');
        detailsDiv.classList.toggle('active');
    });
});