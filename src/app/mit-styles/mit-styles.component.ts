import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'custom-mit-styles',
  standalone: true,
  imports: [],
  templateUrl: './mit-styles.component.html',
  styleUrl: './mit-styles.component.scss'
})
export class MitStylesComponent implements OnInit {
  ngOnInit(): void {
    console.log("mit-styles-component loaded")
  }


}
