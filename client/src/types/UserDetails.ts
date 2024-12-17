import { formatLocation } from "$lib/profile/Utils.svelte"

export class UserDetails {
    firstName: string;
    lastName: string;
    fullName: string;
    userData: User;
    email?: string;
    birthDate: Date;
    gender: 'woman' | 'man';
    sexualPref: 'heterosexual' | 'bisexual' | 'homosexual';
    location: string;
    tags: string[];
    allTags: string[];
    pictures: {
      profile: string;
      additional: string[];
    };
    profilePic: string;
    photos: string[];
    biography: string;
    lastActive: Date | null;
    nbOfLikes: number;
    nbOfViews: number;
    fameRating: number;
    age: number;
    status: 'online' | 'offline';
    formattedDate: string | null;
    formattedTime: string | null;
  
    constructor(
      firstName: string,
      lastName: string,
      userData: User,
      birthDate: Date,
      gender: 'woman' | 'man',
      sexualPref: 'heterosexual' | 'bisexual' | 'homosexual',
      location: string,
      tags: string[],
      allTags: string[],
      pictures: {
        profile: string;
        additional: string[];
      },
      profilePic: string,
      photos: string[],
      biography: string,
      lastActive: Date,
      nbOfLikes: number,
      nbOfViews: number,
      fameRating: number,
      status: 'online' | 'offline',
      email?: string
    ) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.userData = userData;
      this.email = email;
      this.birthDate = birthDate;
      this.gender = gender;
      this.sexualPref = sexualPref;
      this.location = formatLocation(location);
      this.tags = tags;
      this.allTags = allTags;
      this.pictures = pictures; 
      this.profilePic = profilePic;
      this.photos = photos;
      this.biography = biography;
      this.lastActive = lastActive;
      this.nbOfLikes = nbOfLikes;
      this.nbOfViews = nbOfViews;
      this.fameRating = fameRating;
      this.status = status;
      this.age = this.setAge();
      this.fullName = this.setFullName();
      this.formattedDate = lastActive ? lastActive.toLocaleDateString('en-EN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }) : null;
    this.formattedTime = lastActive ? lastActive.toLocaleTimeString('en-EN', {
      hour: '2-digit',
      minute: '2-digit',
  }) : null;
    }

    setAge(): number {
      const today = new Date();
      let age = today.getFullYear() - this.birthDate.getFullYear();
      const monthDiff = today.getMonth() - this.birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.birthDate.getDate())) {
        age--;
      }
      return age;
    }

    setFullName() : string {
      return `${this.firstName} ${this.lastName}`;
    }

    static fromDTO(dto: any): UserDetails {
      return new UserDetails(
          dto.firstName,
          dto.lastName,
          dto.userData,
          new Date(dto.birthDate),
          dto.gender,
          dto.sexualPref,
          dto.location,
          dto.tags,
          dto.allTags,
          dto.pictures,
          dto.profilePic,
          dto.photos,
          dto.biography,
          new Date(dto.lastActive),
          dto.nbOfLikes,
          dto.nbOfViews,
          dto.fameRating,
          dto.status,
          dto.email
        );
      }
  
    }
  