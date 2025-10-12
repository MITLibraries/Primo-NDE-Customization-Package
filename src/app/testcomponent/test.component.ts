import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'custom-test',
  standalone: true,
  imports: [],
  templateUrl: './test.component.html',
  styleUrl: './test.component.scss'
})
export class TestComponent implements OnInit {

  ngOnInit(): void {
    console.log("test component loaded")
  }

}
