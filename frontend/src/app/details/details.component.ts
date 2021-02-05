import { Component, OnInit } from '@angular/core';
import {ElasticsearchService} from "../services/elasticsearch.service";
import {ActivatedRoute, Router} from "@angular/router";
import {SearchResult} from "../models/search-result";
import {environment} from "../../environments/environment";
import {AppSettings} from "../app-settings";
import {ApiService} from "../services/api.service";
import {Tag} from "../models/tag";

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent implements OnInit {

  documentId: string;
  documentData: SearchResult = new SearchResult();
  newTag: string = "";
  tagsAutocomplete = [];
  editingTitle = false;
  newTitle: string = "";
  similarDocuments: SearchResult[] = [];

  constructor(
    private es: ElasticsearchService,
    private apiService: ApiService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadDocument()
    this.router.events.subscribe((val) => {
      this.loadDocument()
    });
  }

  loadDocument(){
    this.documentId = this.activatedRoute.snapshot.params.id;

    this.apiService.fetchTags()
      .subscribe(
        data => {
          this.tagsAutocomplete = this.apiService.transformTagsAutocomplete(data)
        },
        error => console.error(error),
        () => console.log("FINISHED")
      )

    this.es.getById(this.documentId)
      .subscribe(
        data => {
          this.documentData = data;
        },
        error => console.error(error),
        () => console.log("FINISHED")
      );

    this.es.getSimilar(this.documentId)
      .subscribe(
        data => {
          this.similarDocuments = data.hits.hits;
        },
        error => console.error(error),
        () => console.log("FINISHED")
      )
  }

  processDocument(){
    this.apiService.processDocument(this.documentData._source.storage.bucket, this.documentData._source.storage.path)
      .subscribe(
        data => console.log(data),
        error => console.error(error),
        () => console.log("FINSIHED processing document")
      )
  }

  bookmarkDocument(currentState){
    this.es.bookmarkDocument(this.documentData._id, !currentState)
      .subscribe(wrapper => {
          console.log("Successful update")

          if (this.documentData._source.lodestone){
            this.documentData._source.lodestone.bookmark = !currentState
          } else {
            this.documentData._source.lodestone = {
              title: "",
              bookmark: !currentState,
              tags: []
            }
          }
        },
        error => {
          console.error("Failed update", error)
        },
        () => {
          console.log("update finished")
        }
      );
  }

  addDocumentTag(){
    this.es.addDocumentTag(this.documentData._id, this.newTag)
      .subscribe(wrapper => {
          console.log("Successful update")

          if (this.documentData._source.lodestone && this.documentData._source.lodestone.tags){
            this.documentData._source.lodestone.tags.push(this.newTag)
          } else {
            this.documentData._source.lodestone = {
              title: "",
              bookmark: false,
              tags: [this.newTag]
            }
          }
        },
        error => {
          console.error("Failed update", error)
        },
        () => {
          this.newTag = ""
          console.log("update finished")
        }
      );
  }

  removeDocumentTag(existingTag){
    this.es.removeDocumentTag(this.documentData._id, existingTag)
      .subscribe(wrapper => {
          console.log("Successful update")

          if (this.documentData._source.lodestone && this.documentData._source.lodestone.tags){
            this.documentData._source.lodestone.tags.splice(this.documentData._source.lodestone.tags.indexOf(existingTag), 1)
          }
        },
        error => {
          console.error("Failed update", error)
        },
        () => {
          console.log("update finished")
        }
      );
  }

  storageEndpoint(bucket: string, path: string){
    path = path.split('/').map(part => encodeURIComponent(part)).join('/');
    return (environment.apiBase ? environment.apiBase: '') + '/api/v1/storage/' + bucket +'/' + path;
  }

  updateTitle(){
    this.es.updateDocumentTitle(this.documentData._id, this.newTitle)
      .subscribe(wrapper => {
          console.log("Successful update")
          this.documentData._source.lodestone.title = this.newTitle;
          this.newTitle = "";
          this.editingTitle = false;
        },
        error => {
          console.error("Failed update", error)
        },
        () => {
          console.log("update finished")
        }
      );
  }
  discardTitle(){
    this.newTitle = "";
    this.editingTitle = false
  }

}
