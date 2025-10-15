import { Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'custom-mit-styles',
  standalone: true,
  imports: [],
  templateUrl: './mit-styles.component.html',
  styleUrl: './mit-styles.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class MitStylesComponent implements OnInit {
  ngOnInit(): void {
    console.log("mit-styles-component loaded")
  }


}
