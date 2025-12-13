// src\app\components\students\students.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
import { StudentService } from '../../services/student.service';
import { Seminar } from '../../interfaces/seminar'; 
import { Student } from '../../interfaces/student'; // Required for student list

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './students.component.html',
  styleUrl: './students.component.css'
})
export class StudentsComponent implements OnInit {
  
  // --- Seminar State (for the Dropdown) ---
  seminars: Seminar[] = [];
  // seminar_id is char varying(10) in the DB, so it must be a string.
  selectedSeminarId: string | null = null; 
  isLoadingSeminars: boolean = true;
  seminarErrorMessage: string | null = null;
  selectedSeminarDetails: Seminar | null = null; // <--- NEW PROPERTY
  // --- New State for Search/Filter ---
  searchTerm: string = ''; // <--- NEW PROPERTY
  // --- Student List State (for the Table) ---
  students: Student[] = [];
  isLoadingStudents: boolean = false;
  studentsErrorMessage: string | null = null;
  // --- Pagination State ---
  pageSize: number = 10;
  currentPage: number = 1;
  // --- New State for Detail Card ---
selectedStudent: Student | null = null;
isDetailCardOpen: boolean = false;
// --- New State for Editing ---
isEditMode: boolean = false;
editableStudent: Student | null = null;
isUpdating: boolean = false; // Flag to disable the button during API call
updateSuccess: boolean = false;
updateError: string | null = null;
  // --- New State for Generic Column Filtering ---
// This map holds filter terms for every column key (e.g., name: 'anto', email: 'test')
columnFilters: { [key: string]: string } = {
    name: '',
    stud_id: '',
    email: '',
    tshirt_size: '',
    hoodie_size: '',
    city: '',
    country_code: '',
    phone: '',
    position: '',
    diet_type: '',
    status: '',
    // Add any other column keys you want to be able to filter on
};

    // ENUMS for dropdowns
    // 🚀 NEW: Define the fixed size options based on your size_enum
    sizeOptions: string[] = [
        'XS', 'S', 'M', 'L', 'XL', 
        '1XL', '2XL', '3XL', '4XL', '5XL', '6XL'
    ];

    positionsOptions: string[] = [
        'Student', 'Staff', 'Guest'
    ];

    studentStatusOptions: string[] = [
        'Draft', 'Agreement_Completed', 'Paid', 'Done', 'Cancelled'
    ];

    dietTypeOptions: string[] = [
        'Vegetarian', 'Vegan', 'NoPreference'
    ];


  constructor(private studentService: StudentService) { }

  ngOnInit(): void {
    this.fetchSeminars();
  }

  // --- Computed Properties ---

/**
 * Returns the total number of pages required.
 */
get totalPages(): number {
  // Calculate pages based on the filtered list, not the full list
    return Math.ceil(this.filteredStudents.length / this.pageSize);
}

/**
 * Sets the selected student and opens the detail card/modal.
 * @param student The student object to display.
 */
openStudentDetails(student: Student): void {
    this.selectedStudent = student;
    this.isDetailCardOpen = true; // Used to show the modal in the HTML

    // 🚀 NEW: Clear any previous update status when opening a new student's details
    this.updateSuccess = false;
    this.updateError = null;
    this.isEditMode = false; // Ensure it opens in view mode
}

/**
 * Overrides the existing close method to ensure edit mode is cancelled first.
 */
closeStudentDetails(): void {
    this.isDetailCardOpen = false;
    this.selectedStudent = null;
    this.isEditMode = false; // Ensure edit mode is off
    this.editableStudent = null; // Clear all temporary data

    // 🚀 NEW: Clear the success/error banner state when the modal closes
    this.updateSuccess = false; 
    this.updateError = null;
}

/**
 * Returns the subset of students for the current page.
 */
get paginatedStudents(): Student[] {
const studentsToPaginate = this.filteredStudents;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return studentsToPaginate.slice(startIndex, endIndex);
}

// Reset currentPage when search term changes or new students are fetched
onSearchChange(): void {
    this.currentPage = 1;
}

  // --- 1. Seminar Data Fetching (Dropdown Population) ---
// --- 1. Seminar Data Fetching (Dropdown Population) ---
  async fetchSeminars(): Promise<void> {
    this.isLoadingSeminars = true;
    this.seminarErrorMessage = null;

    try {
      this.seminars = await this.studentService.getSeminars();
      
      // If seminars are loaded, determine the best default selection
      if (this.seminars.length > 0 && this.selectedSeminarId === null) {
        
        // Find the closest upcoming seminar
        const closestSeminar = this.findClosestUpcomingSeminar(this.seminars);
        
        if (closestSeminar) {
          console.log('Selected Default Seminar:', closestSeminar.name, 'ID:', closestSeminar.id);
          this.selectedSeminarId = String(closestSeminar.id);
        } else {
          // Fallback to the first seminar if no upcoming one is found
          this.selectedSeminarId = String(this.seminars[0].id);
        }
      }
      // Trigger the student fetch immediately after loading seminars and setting a default selection
      this.onSeminarChange(); 
      
    } catch (error: any) {
      console.error('Failed to load seminars:', error);
      this.seminarErrorMessage = 'Failed to load seminar list. Check backend proxy for /api/seminars.';
    } finally {
      this.isLoadingSeminars = false;
    }
  }

  /**
   * Finds the seminar with a start_date that is the closest date to today (today or future).
   * @param seminars The list of all seminars.
   * @returns The closest upcoming seminar object or the first seminar if none are in the future.
   */
  private findClosestUpcomingSeminar(seminars: Seminar[]): Seminar | null {
    if (seminars.length === 0) {
      return null;
    }

    const today = new Date();
    // Normalize today to midnight for fair date comparison
    today.setHours(0, 0, 0, 0); 
    
    let closestSeminar: Seminar | null = null;
    let closestTimeDifference: number = Infinity;

    for (const seminar of seminars) {
      if (!seminar.start_date) continue;

      // Parse the ISO date string into a Date object
      const startDate = new Date(seminar.start_date);
      startDate.setHours(0, 0, 0, 0);

      // Only consider seminars that are today or in the future
      if (startDate >= today) {
        // Calculate the difference in milliseconds (smaller difference is closer)
        const timeDifference = startDate.getTime() - today.getTime();
        
        if (timeDifference < closestTimeDifference) {
          closestTimeDifference = timeDifference;
          closestSeminar = seminar;
        }
      }
    }
    
    // If we found an upcoming seminar, return it.
    if (closestSeminar) {
      return closestSeminar;
    }
    
    // Fallback: If no upcoming seminar is found, return the first one in the list.
    return seminars[0];
  }
  
  // --- 2. Dropdown Change Handler ---
onSeminarChange(): void {
    // This method is triggered by the (change) event on the <select> element.
    if (this.selectedSeminarId !== null) {
        console.log(`Selected Seminar ID: ${this.selectedSeminarId}. Fetching students...`);
        
        // 💡 UPDATE: Find the full details of the selected seminar
        const seminarIdNum = parseInt(this.selectedSeminarId, 10);
        this.selectedSeminarDetails = this.seminars.find(s => s.id === seminarIdNum) || null;
        
        this.fetchStudents(this.selectedSeminarId);
    } else {
      // Clear the list if the selection is somehow reset
      this.students = [];
      this.selectedSeminarDetails = null; // <--- Clear details
    }
  }

  // --- 3. Student Data Fetching (Table Population) ---
  async fetchStudents(seminarId: string): Promise<void> { 
    this.isLoadingStudents = true;
    this.studentsErrorMessage = null;
    this.students = []; 

    try {
      this.students = await this.studentService.getStudents(seminarId);

      // 💡 Reset pagination here!
      this.currentPage = 1;
      this.searchTerm = ''; // <--- Optional: Clear search term on new seminar load
      
    } catch (error: any) {
      console.error(`Failed to load students for seminar ${seminarId}:`, error);
      this.studentsErrorMessage = 'Could not load student list. Please check network connection and backend logs.';
    } finally {
      this.isLoadingStudents = false;
    }
  }

  // src\app\components\Students\students.component.ts (Add this method)

// ... inside export class StudentsComponent implements OnInit {

  /**
   * Helper method to convert a number to a string for use in the template [ngValue] binding.
   * Angular templates do not natively recognize the global 'String' constructor.
   */
  public convertToString(value: number | null | undefined): string {
    return String(value);
  }

  /**
   * Changes the current page number.
   * @param page The new page number to navigate to.
   */
  changePage(page: number): void { // <--- THIS METHOD IS REQUIRED!
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

/**
 * Returns the list of students after applying the current global search and column filters.
 */
get filteredStudents(): Student[] {
    let students = this.students;
    const globalTerm = this.searchTerm.toLowerCase();
    
    // 1. Apply Global Search Term (Name, ID, Email)
    if (globalTerm) {
        students = students.filter(student => 
            student.name.toLowerCase().includes(globalTerm) ||
            (student.stud_id?.toLowerCase() || '').includes(globalTerm) ||
            (student.email?.toLowerCase() || '').includes(globalTerm)
        );
    }
    
    // 2. Apply Column Filters (Generic Text Match for ALL columns)
    for (const key of Object.keys(this.columnFilters)) {
        const filterValue = this.columnFilters[key];
        
        if (filterValue) {
            const filterTerm = filterValue.toLowerCase();

            students = students.filter(student => {
                const studentValue = (student as any)[key]; 
                
                if (studentValue === null || studentValue === undefined) {
                    return false; // Skip students with missing values
                }

                // --- SPECIAL HANDLING FOR BOOLEAN ALLERGIES ---
                if (key === 'food_allergies') {
                    // Convert boolean to "yes" or "no" string for comparison
                    const allergyString = studentValue ? 'yes' : 'no';
                    return allergyString.includes(filterTerm);
                }
                // ---------------------------------------------

                // Default: General string comparison for all other columns
                return String(studentValue).toLowerCase().includes(filterTerm);
            });
        }
    }

    return students;
}

/**
     * Resets the current page to 1 whenever a column filter value changes.
     * This ensures the user is seeing filtered results from the beginning of the list.
     */
    onFilterChange(): void {
        this.currentPage = 1;
    }

    /**
 * Enters Edit Mode: Copies student data and switches view.
 */
enterEditMode(): void {
    if (this.selectedStudent) {
        // Create a deep copy of the student data to avoid changing the original data
        // until the update is successful.
        this.editableStudent = { ...this.selectedStudent }; 
        this.isEditMode = true;
        this.updateSuccess = false;
        this.updateError = null;
    }
}

/**
 * Exits Edit Mode without saving changes.
 */
cancelEditMode(): void {
    this.isEditMode = false;
    this.editableStudent = null; // Clear the temporary data
}

/**
 * Calls the API service to save the updated student data.
 */
confirmUpdate(): void {
    if (!this.editableStudent || this.isUpdating) {
        return;
    }

    this.isUpdating = true;
    this.updateSuccess = false;
    this.updateError = null;

    // TODO: 1. Replace this with your actual student service update call.
    this.studentService.updateStudent(this.editableStudent).subscribe({
        next: (updatedStudent) => {
            // Update the main student list with the saved data
            const index = this.students.findIndex(s => s.stud_id === updatedStudent.stud_id);
            if (index !== -1) {
                this.students[index] = updatedStudent;
            }

            // Update the currently viewed student and exit edit mode
            this.selectedStudent = updatedStudent;
            this.isEditMode = false;
            this.isUpdating = false;
            this.updateSuccess = true; // Show success message briefly

            // Re-trigger filtering/pagination to refresh the table view
            // You may need to manually trigger a change detection or recalculate filteredStudents
            this.onFilterChange(); 
        },
        error: (err) => {
            this.isUpdating = false;
            this.updateError = 'Update failed: ' + (err.error?.message || 'Server error.');
            console.error('Student update error:', err);
        }
    });
}



// ... rest of the component
}