function tableToCSV(table) {
  // Get headers and their column indices
  const headerCells = Array.from(table.querySelectorAll('thead th'));
  const validColumnIndices = headerCells
    .map((header, index) => {
      const innerDiv = header.querySelector('div.tablesorter-header-inner');
      return innerDiv?.textContent.trim() ? index : -1;
    })
    .filter(index => index !== -1);

  // Get headers text for valid columns
  const headers = headerCells
    .filter((_, index) => validColumnIndices.includes(index))
    .map(header => header.querySelector('div.tablesorter-header-inner').textContent
      .replace(/[\n\t\r]+/g, ' ')
      .trim());
  
  // Add "Link" header
  headers.push('Link');
  
  // Get data from tbody
  const data = Array.from(table.querySelectorAll('tbody tr'))
    .map(row => {
      const cells = Array.from(row.getElementsByTagName('td'))
        // Only include cells from valid columns
        .filter((_, index) => validColumnIndices.includes(index))
        .map(cell => cell.textContent
          .replace(/[\n\t\r]+/g, ' ')
          .trim());
      
      // Add link column
      const targetCell = row.children[1];
      if (targetCell) {
        const location = targetCell.getAttribute('data-location');
        if (location) {
          const routeObj = { to: location };
          const encodedRoute = btoa(JSON.stringify(routeObj));
          cells.push(`${window.location.origin}/?${encodedRoute}`);
        } else {
          cells.push('');
        }
      } else {
        cells.push('');
      }
      
      return cells.join('\t');
    });
  
  // Combine headers and data
  return [
    headers.join('\t'),
    ...data
  ].join('\n');
}

function addExportButton() {
  const table = document.getElementById('table-sorter');
  if (!table) return;

  // Check if button already exists
  if (document.querySelector('.pp-export-btn')) return;

  // Create export button
  const exportBtn = document.createElement('button');
  exportBtn.className = 'pp-export-btn';
  exportBtn.innerHTML = '📋 Copy to Clipboard';
  exportBtn.title = 'Copy table data as CSV';
  
  exportBtn.addEventListener('click', async () => {
    const csv = tableToCSV(table);
    
    try {
      await navigator.clipboard.writeText(csv);
      exportBtn.innerHTML = '✅ Copied!';
      setTimeout(() => {
        exportBtn.innerHTML = '📋 Copy to Clipboard';
      }, 2000);
    } catch (err) {
      exportBtn.innerHTML = '❌ Failed to copy';
      console.error('Failed to copy:', err);
    }
  });

  // Insert button before the table
  table.parentNode.insertBefore(exportBtn, table);
}

function addLinkIcons() {
  const table = document.getElementById('table-sorter');
  if (!table) return;

  // Find all rows within tbody
  const tbody = table.querySelector('tbody');
  if (!tbody) return;
  
  const rows = tbody.getElementsByTagName('tr');
  
  for (const row of rows) {
    // Get the second column (index 1)
    const targetCell = row.children[1];
    if (!targetCell) continue;
    
    // Skip if we've already added a link icon
    if (targetCell.querySelector('.pp-link-icon')) continue;

    // Get the data-location attribute
    const location = targetCell.getAttribute('data-location');
    if (!location) continue;

    // Create the JSON object and encode it
    const routeObj = { to: location };
    const encodedRoute = btoa(JSON.stringify(routeObj));
    
    // Create link element
    const link = document.createElement('a');
    link.href = `?${encodedRoute}`;
    link.target = '_blank';
    link.className = 'pp-link-icon';
    link.title = 'Open in new tab';
    link.innerHTML = '&nbsp;🔗';
    
    // Prevent the original onclick from firing when clicking our link
    link.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Add the link next to the text
    targetCell.appendChild(link);
  }
}

// Run when the page loads
document.addEventListener('DOMContentLoaded', () => {
  addLinkIcons();
  addExportButton();
});

// Also run when content is updated via AJAX
const observer = new MutationObserver(() => {
  addLinkIcons();
  addExportButton();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
}); 