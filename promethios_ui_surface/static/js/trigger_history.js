// JavaScript for trigger history page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize filters
    initFilters();
    
    // Initialize modal functionality
    initModal();
    
    // Initialize refresh button
    document.getElementById('refresh-btn').addEventListener('click', function() {
        window.location.reload();
    });
});

function initFilters() {
    const triggerTypeFilter = document.getElementById('trigger-type-filter');
    const dateFilter = document.getElementById('date-filter');
    const triggerRows = document.querySelectorAll('tbody tr[data-trigger-type]');
    
    function applyFilters() {
        const selectedType = triggerTypeFilter.value;
        const selectedDate = dateFilter.value;
        
        triggerRows.forEach(row => {
            const rowType = row.getAttribute('data-trigger-type');
            const rowDate = row.querySelector('td:nth-child(3)').textContent.split('T')[0];
            
            let showRow = true;
            
            if (selectedType !== 'all' && rowType !== selectedType) {
                showRow = false;
            }
            
            if (selectedDate && rowDate !== selectedDate) {
                showRow = false;
            }
            
            row.style.display = showRow ? '' : 'none';
        });
    }
    
    triggerTypeFilter.addEventListener('change', applyFilters);
    dateFilter.addEventListener('change', applyFilters);
}

function initModal() {
    const modal = document.getElementById('trigger-details-modal');
    const detailsContent = document.getElementById('trigger-details-content');
    const closeBtn = document.querySelector('.close');
    const viewDetailsBtns = document.querySelectorAll('.view-details-btn');
    
    viewDetailsBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const triggerId = this.getAttribute('data-trigger-id');
            
            // Fetch trigger details from the server
            fetch(`/api/v1/trigger/${triggerId}`)
                .then(response => response.json())
                .then(data => {
                    renderTriggerDetails(data);
                })
                .catch(error => {
                    detailsContent.innerHTML = `
                        <div class="error-message">
                            <p>Error loading trigger details: ${error.message}</p>
                        </div>
                    `;
                });
            
            modal.style.display = 'block';
        });
    });
    
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function renderTriggerDetails(data) {
    const detailsContent = document.getElementById('trigger-details-content');
    
    let sourceDetails = '';
    if (data.source && data.source.metadata) {
        for (const [key, value] of Object.entries(data.source.metadata)) {
            sourceDetails += `<p><strong>${key}:</strong> ${value}</p>`;
        }
    }
    
    let executionResult = 'No execution result available';
    if (data.execution_result) {
        executionResult = JSON.stringify(data.execution_result, null, 2);
    }
    
    detailsContent.innerHTML = `
        <div class="details-section">
            <h4>Trigger Information</h4>
            <p><strong>ID:</strong> ${data.trigger_id}</p>
            <p><strong>Type:</strong> ${data.trigger_type}</p>
            <p><strong>Timestamp:</strong> ${data.timestamp}</p>
            <p><strong>Status:</strong> ${data.status}</p>
        </div>
        <div class="details-section">
            <h4>Source Information</h4>
            <p><strong>Identifier:</strong> ${data.source ? data.source.identifier : 'N/A'}</p>
            <p><strong>Type:</strong> ${data.source ? data.source.type : 'N/A'}</p>
            ${sourceDetails}
        </div>
        <div class="details-section">
            <h4>Execution Result</h4>
            <pre>${executionResult}</pre>
        </div>
    `;
}
